import {
  assetTypeFromContractValue,
  decodeMetadata,
  productionModeFromContractValue,
  type IndexedMarketData,
} from "@/lib/marketData";
import { type Address, type Hex } from "viem";

type IndexerContract = {
  assetId: string;
  owner: Address;
  assetType: number;
  productionMode: number;
  priceWei: string;
  metadataUri: string;
  activeVersionId?: string | null;
  contentHash?: Hex | null;
  contentUri?: string | null;
  subscriberCount: number;
  feedbackCount: number;
  scoreTotal: number;
};

type IndexerSubscription = {
  subscriptionId: string;
  assetId: string;
  buyer: Address;
  activeVersionId: string;
  amountWei: string;
  expiresAt: string;
  transactionHash: Hex;
};

type IndexerTrustEvent = {
  type: string;
  assetId?: string | null;
  subscriptionId?: string | null;
  transactionHash: Hex;
};

const marketQuery = `query MarketData {
  KnowledgeContract(order_by: { assetId: desc }) {
    assetId
    owner
    assetType
    productionMode
    priceWei
    metadataUri
    activeVersionId
    contentHash
    contentUri
    subscriberCount
    feedbackCount
    scoreTotal
  }
  Subscription(order_by: { subscriptionId: desc }) {
    subscriptionId
    assetId
    buyer
    activeVersionId
    amountWei
    expiresAt
    transactionHash
  }
  TrustEvent(order_by: { blockNumber: desc }, limit: 20) {
    type
    assetId
    subscriptionId
    transactionHash
  }
}`;

export async function fetchIndexedMarketData(endpoint?: string): Promise<IndexedMarketData | undefined> {
  if (!endpoint) return undefined;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: marketQuery }),
  });
  if (!response.ok) throw new Error(`Indexer returned ${response.status}`);

  const payload = await response.json() as {
    data?: {
      KnowledgeContract?: IndexerContract[];
      Subscription?: IndexerSubscription[];
      TrustEvent?: IndexerTrustEvent[];
    };
    errors?: Array<{ message: string }>;
  };
  if (payload.errors?.length) throw new Error(payload.errors.map((error) => error.message).join("; "));

  const contracts = (payload.data?.KnowledgeContract ?? []).map((row) => {
    const feedbackCount = Number(row.feedbackCount);
    return {
      assetId: BigInt(row.assetId),
      owner: row.owner,
      type: assetTypeFromContractValue(Number(row.assetType)),
      productionMode: productionModeFromContractValue(Number(row.productionMode)),
      priceWei: BigInt(row.priceWei),
      metadataUri: row.metadataUri,
      metadata: decodeMetadata(row.metadataUri),
      activeVersionId: row.activeVersionId ? BigInt(row.activeVersionId) : undefined,
      contentHash: row.contentHash ?? undefined,
      contentUri: row.contentUri ?? undefined,
      subscriberCount: Number(row.subscriberCount),
      feedbackCount,
      averageScore: feedbackCount > 0 ? Number(row.scoreTotal) / feedbackCount : undefined,
      source: "indexer" as const,
    };
  });

  const subscriptions = (payload.data?.Subscription ?? []).map((row) => ({
    subscriptionId: BigInt(row.subscriptionId),
    assetId: BigInt(row.assetId),
    buyer: row.buyer,
    activeVersionId: BigInt(row.activeVersionId),
    amountWei: BigInt(row.amountWei),
    expiresAt: BigInt(row.expiresAt),
    transactionHash: row.transactionHash,
  }));

  const events = (payload.data?.TrustEvent ?? []).map((row) => ({
    type: row.type,
    detail: `${row.assetId ? `知识合约 #${row.assetId}` : ""}${row.subscriptionId ? ` 订阅 #${row.subscriptionId}` : ""}`.trim() || "链上事件已同步。",
    transactionHash: row.transactionHash,
  }));

  return { contracts, subscriptions, events };
}
