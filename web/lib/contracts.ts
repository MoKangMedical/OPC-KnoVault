import { isAddress, type Address } from "viem";

export const monadTestnetChainId = 10143;

export const opcTrustMarketAbi = [
  {
    type: "function",
    name: "verifiedOpc",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "nextAssetId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "verifyOpc",
    stateMutability: "nonpayable",
    inputs: [{ name: "opc", type: "address" }],
    outputs: [],
  },
  {
    type: "function",
    name: "registerAsset",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assetType", type: "uint8" },
      { name: "productionMode", type: "uint8" },
      { name: "priceWei", type: "uint256" },
      { name: "metadataUri", type: "string" },
    ],
    outputs: [{ name: "assetId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getAsset",
    stateMutability: "view",
    inputs: [{ name: "assetId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "owner", type: "address" },
          { name: "assetType", type: "uint8" },
          { name: "productionMode", type: "uint8" },
          { name: "priceWei", type: "uint256" },
          { name: "metadataUri", type: "string" },
          { name: "activeVersionId", type: "uint256" },
          { name: "listed", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "publishVersion",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assetId", type: "uint256" },
      { name: "contentHash", type: "bytes32" },
      { name: "uri", type: "string" },
    ],
    outputs: [{ name: "versionId", type: "uint256" }],
  },
  {
    type: "function",
    name: "subscribe",
    stateMutability: "payable",
    inputs: [{ name: "assetId", type: "uint256" }],
    outputs: [{ name: "subscriptionId", type: "uint256" }],
  },
  {
    type: "function",
    name: "submitStructuredFeedback",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assetId", type: "uint256" },
      { name: "score", type: "uint8" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "releaseMyEscrow",
    stateMutability: "nonpayable",
    inputs: [{ name: "subscriptionId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "event",
    name: "OpcVerified",
    inputs: [{ indexed: true, name: "opc", type: "address" }],
  },
  {
    type: "event",
    name: "KnowledgeAssetRegistered",
    inputs: [
      { indexed: true, name: "assetId", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "assetType", type: "uint8" },
      { indexed: false, name: "productionMode", type: "uint8" },
      { indexed: false, name: "priceWei", type: "uint256" },
      { indexed: false, name: "metadataUri", type: "string" },
    ],
  },
  {
    type: "event",
    name: "AssetVersionPublished",
    inputs: [
      { indexed: true, name: "assetId", type: "uint256" },
      { indexed: true, name: "versionId", type: "uint256" },
      { indexed: false, name: "contentHash", type: "bytes32" },
      { indexed: false, name: "uri", type: "string" },
    ],
  },
  {
    type: "event",
    name: "SubscriptionPurchased",
    inputs: [
      { indexed: true, name: "subscriptionId", type: "uint256" },
      { indexed: true, name: "assetId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "activeVersionId", type: "uint256" },
      { indexed: false, name: "amountWei", type: "uint256" },
      { indexed: false, name: "expiresAt", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "EscrowReleased",
    inputs: [
      { indexed: true, name: "subscriptionId", type: "uint256" },
      { indexed: true, name: "seller", type: "address" },
      { indexed: false, name: "sellerAmountWei", type: "uint256" },
      { indexed: false, name: "platformFeeWei", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "StructuredFeedbackSubmitted",
    inputs: [
      { indexed: true, name: "assetId", type: "uint256" },
      { indexed: true, name: "buyer", type: "address" },
      { indexed: false, name: "score", type: "uint8" },
    ],
  },
] as const;

export function getContractAddress(): Address | undefined {
  const value = process.env.NEXT_PUBLIC_OPC_TRUST_MARKET_ADDRESS;
  return value && isAddress(value) ? value : undefined;
}
