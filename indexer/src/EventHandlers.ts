import {
  OPCTrustMarket,
  Opc,
  KnowledgeContract,
  Subscription,
  TrustEvent,
} from "generated";

OPCTrustMarket.OpcVerified.handler(async ({ event, context }) => {
  const id = event.params.opc.toLowerCase();
  context.Opc.set({
    id,
    wallet: event.params.opc,
    verifiedAtBlock: event.block.number,
    transactionHash: event.transaction.hash,
  });
  context.TrustEvent.set(trustEvent(event, "OpcVerified", { actor: event.params.opc }));
});

OPCTrustMarket.KnowledgeAssetRegistered.handler(async ({ event, context }) => {
  const id = event.params.assetId.toString();
  context.KnowledgeContract.set({
    id,
    assetId: event.params.assetId,
    owner: event.params.owner,
    assetType: event.params.assetType,
    productionMode: event.params.productionMode,
    priceWei: event.params.priceWei,
    metadataUri: event.params.metadataUri,
    activeVersionId: undefined,
    contentHash: undefined,
    contentUri: undefined,
    subscriberCount: 0,
    feedbackCount: 0,
    scoreTotal: 0,
    createdAtBlock: event.block.number,
    transactionHash: event.transaction.hash,
  });
  context.TrustEvent.set(trustEvent(event, "KnowledgeAssetRegistered", {
    assetId: event.params.assetId,
    actor: event.params.owner,
  }));
});

OPCTrustMarket.AssetVersionPublished.handler(async ({ event, context }) => {
  const id = event.params.assetId.toString();
  const existing = await context.KnowledgeContract.get(id);
  if (existing) {
    context.KnowledgeContract.set({
      ...existing,
      activeVersionId: event.params.versionId,
      contentHash: event.params.contentHash,
      contentUri: event.params.uri,
    });
  }
  context.TrustEvent.set(trustEvent(event, "AssetVersionPublished", { assetId: event.params.assetId }));
});

OPCTrustMarket.SubscriptionPurchased.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  context.Subscription.set({
    id,
    subscriptionId: event.params.subscriptionId,
    assetId: event.params.assetId,
    buyer: event.params.buyer,
    activeVersionId: event.params.activeVersionId,
    amountWei: event.params.amountWei,
    expiresAt: event.params.expiresAt,
    escrowStatus: "held",
    transactionHash: event.transaction.hash,
  });

  const assetId = event.params.assetId.toString();
  const existing = await context.KnowledgeContract.get(assetId);
  if (existing) {
    context.KnowledgeContract.set({
      ...existing,
      subscriberCount: existing.subscriberCount + 1,
    });
  }

  context.TrustEvent.set(trustEvent(event, "SubscriptionPurchased", {
    assetId: event.params.assetId,
    subscriptionId: event.params.subscriptionId,
    actor: event.params.buyer,
  }));
});

OPCTrustMarket.StructuredFeedbackSubmitted.handler(async ({ event, context }) => {
  const assetId = event.params.assetId.toString();
  const existing = await context.KnowledgeContract.get(assetId);
  if (existing) {
    context.KnowledgeContract.set({
      ...existing,
      feedbackCount: existing.feedbackCount + 1,
      scoreTotal: existing.scoreTotal + event.params.score,
    });
  }
  context.TrustEvent.set(trustEvent(event, "StructuredFeedbackSubmitted", {
    assetId: event.params.assetId,
    actor: event.params.buyer,
  }));
});

OPCTrustMarket.EscrowReleased.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  const existing = await context.Subscription.get(id);
  if (existing) {
    context.Subscription.set({ ...existing, escrowStatus: "released" });
  }
  context.TrustEvent.set(trustEvent(event, "EscrowReleased", {
    subscriptionId: event.params.subscriptionId,
    actor: event.params.seller,
  }));
});

OPCTrustMarket.FirstTermRefunded.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  const existing = await context.Subscription.get(id);
  if (existing) {
    context.Subscription.set({ ...existing, escrowStatus: "refunded" });
  }
  context.TrustEvent.set(trustEvent(event, "FirstTermRefunded", {
    subscriptionId: event.params.subscriptionId,
    actor: event.params.buyer,
  }));
});

function trustEvent(
  event: { transaction: { hash: string }; block: { number: bigint } },
  type: string,
  values: { assetId?: bigint; subscriptionId?: bigint; actor?: string },
): TrustEvent {
  return {
    id: `${event.transaction.hash}-${type}-${values.assetId?.toString() ?? values.subscriptionId?.toString() ?? values.actor ?? "global"}`,
    type,
    assetId: values.assetId,
    subscriptionId: values.subscriptionId,
    actor: values.actor,
    transactionHash: event.transaction.hash,
    blockNumber: event.block.number,
  };
}
