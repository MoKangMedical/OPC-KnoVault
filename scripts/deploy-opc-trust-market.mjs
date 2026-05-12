import { readFile } from "node:fs/promises";
import solc from "solc";
import { createPublicClient, createWalletClient, http } from "viem";
import { monadTestnet } from "viem/chains";
import { loadOrCreateAgentAccount } from "./monad-agent-wallet.mjs";

const rpcUrl = process.env.MONAD_RPC_URL ?? "https://testnet-rpc.monad.xyz/";
const feeRecipient = process.env.FEE_RECIPIENT;

if (!feeRecipient) {
  throw new Error("Set FEE_RECIPIENT to the wallet that should receive platform fees.");
}

const source = await readFile("contracts/OPCTrustMarket.sol", "utf8");
const input = {
  language: "Solidity",
  sources: {
    "OPCTrustMarket.sol": { content: source },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));
const errors = output.errors?.filter((error) => error.severity === "error") ?? [];
if (errors.length > 0) {
  throw new Error(errors.map((error) => error.formattedMessage).join("\n"));
}

const compiled = output.contracts["OPCTrustMarket.sol"].OPCTrustMarket;
const bytecode = `0x${compiled.evm.bytecode.object}`;
const { account, created, keystorePath } = await loadOrCreateAgentAccount();

const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(rpcUrl),
});
const walletClient = createWalletClient({
  account,
  chain: monadTestnet,
  transport: http(rpcUrl),
});

const balance = await publicClient.getBalance({ address: account.address });
if (balance === 0n) {
  console.log(JSON.stringify({
    status: "needs_funding",
    address: account.address,
    created,
    keystorePath,
    message: "Fund this address with Monad testnet MON, then rerun the deploy script.",
  }, null, 2));
  process.exit(2);
}

const hash = await walletClient.deployContract({
  abi: compiled.abi,
  bytecode,
  args: [feeRecipient],
});
console.log(JSON.stringify({
  status: "submitted",
  deployer: account.address,
  transactionHash: hash,
}, null, 2));

const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log(JSON.stringify({
  status: receipt.status,
  contractAddress: receipt.contractAddress,
  transactionHash: receipt.transactionHash,
  blockNumber: receipt.blockNumber.toString(),
}, null, 2));
