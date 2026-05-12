import type { Address } from "viem";

export const opcMarketAddress = process.env
  .NEXT_PUBLIC_OPC_MARKET_ADDRESS as Address | undefined;

export const opcMarketAbi = [
  {
    type: "function",
    name: "subscribe",
    stateMutability: "payable",
    inputs: [
      { name: "assetId", type: "uint256" },
      { name: "accessHash", type: "bytes32" },
      { name: "accessURI", type: "string" },
    ],
    outputs: [{ name: "subscriptionId", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "subscriptionId", type: "uint256" },
      { name: "rating", type: "uint8" },
      { name: "feedbackHash", type: "bytes32" },
      { name: "feedbackURI", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "approveFirstTerm",
    stateMutability: "nonpayable",
    inputs: [{ name: "subscriptionId", type: "uint256" }],
    outputs: [],
  },
] as const;
