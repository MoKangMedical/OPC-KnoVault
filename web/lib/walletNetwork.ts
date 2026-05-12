export async function addMonadTestnetToWallet() {
  const ethereum = getEthereumProvider();
  if (!ethereum) {
    throw new Error("MetaMask provider not found");
  }

  await ethereum.request({
    method: "wallet_addEthereumChain",
    params: [
      {
        chainId: "0x279f",
        chainName: "Monad Testnet",
        nativeCurrency: {
          name: "MON",
          symbol: "MON",
          decimals: 18,
        },
        rpcUrls: ["https://testnet-rpc.monad.xyz/"],
        blockExplorerUrls: ["https://testnet.monadexplorer.com/"],
      },
    ],
  });
}

function getEthereumProvider() {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EthereumProvider }).ethereum;
}

type EthereumProvider = {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
};
