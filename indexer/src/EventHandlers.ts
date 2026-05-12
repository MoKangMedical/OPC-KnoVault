import {
  OPCMarket,
  Opc,
  KnowledgeAsset,
  Subscription,
  TrustEvent,
} from "generated";

OPCMarket.OPCVerified.handler(async ({ event, context }) => {
  const id = event.params.opc.toLowerCase();
  context.Opc.set({
    id,
    wallet: event.params.opc,
    verificationHash: event.params.verificationHash,
    uri: event.params.uri,
    verifiedAtBlock: event.block.number,
    transactionHash: event.transaction.hash,
  });
  context.TrustEvent.set(trustEvent(event, "OPCVerified", { actor: event.params.opc }));
});

OPCMarket.AssetRegistered.handler(async ({ event, context }) => {
  const id = event.params.assetId.toString();
  context.KnowledgeAsset.set({
    id,
    assetId: event.params.assetId,
    seller: event.params.seller,
    assetType: event.params.assetType,
    productionMode: event.params.productionMode,
    assetHash: event.params.assetHash,
    priceWei: event.params.price,
    subscriptionDuration: event.params.subscriptionDuration,
    version: 1,
    versionHash: undefined,
    versionUri: undefined,
    subscriberCount: 0,
    feedbackCount: 0,
    scoreTotal: 0,
    createdAtBlock: event.block.number,
    transactionHash: event.transaction.hash,
  });
  context.TrustEvent.set(trustEvent(event, "AssetRegistered", {
    assetId: event.params.assetId,
    actor: event.params.seller,
  }));
});

OPCMarket.AssetVersionPublished.handler(async ({ event, context }) => {
  const id = event.params.assetId.toString();
  const existing = await context.KnowledgeAsset.get(id);
  if (existing) {
    context.KnowledgeAsset.set({
      ...existing,
      version: Number(event.params.version),
      versionHash: event.params.versionHash,
      versionUri: event.params.versionURI,
    });
  }
  context.TrustEvent.set(trustEvent(event, "AssetVersionPublished", { assetId: event.params.assetId }));
});

OPCMarket.SubscriptionCreated.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  context.Subscription.set({
    id,
    subscriptionId: event.params.subscriptionId,
    assetId: event.params.assetId,
    buyer: event.params.buyer,
    seller: event.params.seller,
    valueWei: event.params.value,
    accessEndsAt: event.params.accessEndsAt,
    accessHash: event.params.accessHash,
    accessUri: event.params.accessURI,
    status: "active",
    feedbackRating: undefined,
    feedbackHash: undefined,
    feedbackUri: undefined,
    transactionHash: event.transaction.hash,
  });

  const assetId = event.params.assetId.toString();
  const existing = await context.KnowledgeAsset.get(assetId);
  if (existing) {
    context.KnowledgeAsset.set({
      ...existing,
      subscriberCount: existing.subscriberCount + 1,
    });
  }

  context.TrustEvent.set(trustEvent(event, "SubscriptionCreated", {
    assetId: event.params.assetId,
    subscriptionId: event.params.subscriptionId,
    actor: event.params.buyer,
  }));
});

OPCMarket.FeedbackSubmitted.handler(async ({ event, context }) => {
  const subscriptionId = event.params.subscriptionId.toString();
  const subscription = await context.Subscription.get(subscriptionId);
  if (subscription) {
    context.Subscription.set({
      ...subscription,
      feedbackRating: event.params.rating,
      feedbackHash: event.params.feedbackHash,
      feedbackUri: event.params.feedbackURI,
    });

    const assetId = subscription.assetId.toString();
    const asset = await context.KnowledgeAsset.get(assetId);
    if (asset) {
      context.KnowledgeAsset.set({
        ...asset,
        feedbackCount: asset.feedbackCount + 1,
        scoreTotal: asset.scoreTotal + event.params.rating,
      });
    }
  }

  context.TrustEvent.set(trustEvent(event, "FeedbackSubmitted", {
    subscriptionId: event.params.subscriptionId,
  }));
});

OPCMarket.FirstTermApproved.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  const existing = await context.Subscription.get(id);
  if (existing) {
    context.Subscription.set({ ...existing, status: "released" });
  }
  context.TrustEvent.set(trustEvent(event, "FirstTermApproved", {
    subscriptionId: event.params.subscriptionId,
  }));
});

OPCMarket.SubscriptionDisputed.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  const existing = await context.Subscription.get(id);
  if (existing) {
    context.Subscription.set({ ...existing, status: "disputed" });
  }
  context.TrustEvent.set(trustEvent(event, "SubscriptionDisputed", {
    subscriptionId: event.params.subscriptionId,
  }));
});

OPCMarket.DisputeResolved.handler(async ({ event, context }) => {
  const id = event.params.subscriptionId.toString();
  const existing = await context.Subscription.get(id);
  if (existing) {
    context.Subscription.set({
      ...existing,
      status: event.params.refundedBuyer ? "refunded" : "released",
    });
  }
  context.TrustEvent.set(trustEvent(event, "DisputeResolved", {
    subscriptionId: event.params.subscriptionId,
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
