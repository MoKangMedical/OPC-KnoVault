import { formatEther, keccak256, stringToHex, type Address, type Hex } from "viem";

export type AssetTypeLabel = "Document / Report" | "Template / Methodology" | "Dataset / Annotation Pack";
export type ProductionModeLabel = "Human-authored" | "AI-assisted" | "Agent-executed";

export type ContractMetadata = {
  title: string;
  summary: string;
  preview: string;
  body: string;
  updateCadence: string;
  opcName: string;
  portfolioSamples: string[];
};

export type KnowledgeContract = {
  assetId: bigint;
  owner: Address;
  type: AssetTypeLabel;
  productionMode: ProductionModeLabel;
  priceWei: bigint;
  metadataUri: string;
  metadata: ContractMetadata;
  activeVersionId?: bigint;
  contentHash?: Hex;
  contentUri?: string;
  subscriberCount: number;
  feedbackCount: number;
  averageScore?: number;
  source: "chain" | "indexer" | "draft";
};

export type SubscriptionRecord = {
  subscriptionId: bigint;
  assetId: bigint;
  buyer: Address;
  activeVersionId: bigint;
  amountWei: bigint;
  expiresAt: bigint;
  transactionHash?: Hex;
};

export type TrustEventRow = {
  type: string;
  detail: string;
  transactionHash?: Hex;
};

export type IndexedMarketData = {
  contracts: KnowledgeContract[];
  subscriptions: SubscriptionRecord[];
  events: TrustEventRow[];
};

export const assetTypeLabels: Record<AssetTypeLabel, string> = {
  "Document / Report": "研究报告",
  "Template / Methodology": "模板方法论",
  "Dataset / Annotation Pack": "数据标注包",
};

export const productionLabels: Record<ProductionModeLabel, string> = {
  "Human-authored": "人工原创",
  "AI-assisted": "AI 辅助",
  "Agent-executed": "Agent 执行",
};

export function assetTypeToContractValue(type: AssetTypeLabel) {
  if (type === "Document / Report") return 0;
  if (type === "Template / Methodology") return 1;
  return 2;
}

export function productionModeToContractValue(mode: ProductionModeLabel) {
  if (mode === "Human-authored") return 0;
  if (mode === "AI-assisted") return 1;
  return 2;
}

export function assetTypeFromContractValue(value: number): AssetTypeLabel {
  if (value === 0) return "Document / Report";
  if (value === 1) return "Template / Methodology";
  return "Dataset / Annotation Pack";
}

export function productionModeFromContractValue(value: number): ProductionModeLabel {
  if (value === 0) return "Human-authored";
  if (value === 1) return "AI-assisted";
  return "Agent-executed";
}

export function encodeMetadata(metadata: ContractMetadata) {
  return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
}

export function decodeMetadata(uri: string): ContractMetadata {
  if (uri.startsWith("data:application/json,")) {
    const json = decodeURIComponent(uri.slice("data:application/json,".length));
    return normalizeMetadata(JSON.parse(json));
  }

  return normalizeMetadata({
    title: "未命名知识合约",
    summary: `链上 metadata: ${uri}`,
    preview: "metadata URI 指向外部内容，indexer 已记录链上来源。",
    body: "完整内容由发布者的链下存储提供。",
    updateCadence: "Monthly",
    opcName: "Verified OPC",
    portfolioSamples: [],
  });
}

function normalizeMetadata(value: Partial<ContractMetadata>): ContractMetadata {
  return {
    title: value.title || "未命名知识合约",
    summary: value.summary || "暂无简介",
    preview: value.preview || "暂无免费预览",
    body: value.body || "订阅后由内容 URI 提供完整正文。",
    updateCadence: value.updateCadence || "Monthly",
    opcName: value.opcName || "Verified OPC",
    portfolioSamples: value.portfolioSamples?.filter(Boolean).slice(0, 3) ?? [],
  };
}

export function contentHashFor(metadata: ContractMetadata) {
  return keccak256(stringToHex(`${metadata.title}:${metadata.body}:${metadata.updateCadence}`));
}

export function formatMon(value: bigint) {
  const formatted = Number(formatEther(value));
  return formatted >= 1 ? formatted.toFixed(2) : formatted.toFixed(4);
}

export function sameAddress(left?: Address | string, right?: Address | string) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

export function shorten(value: Address | string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
