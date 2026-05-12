import { mkdir, readFile, writeFile } from "node:fs/promises";
import solc from "solc";

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
await mkdir("web/lib/generated", { recursive: true });
await writeFile(
  "web/lib/generated/opcTrustMarketArtifact.ts",
  `export const opcTrustMarketBytecode = "0x${compiled.evm.bytecode.object}" as const;\n`,
);
console.log("Wrote web/lib/generated/opcTrustMarketArtifact.ts");
