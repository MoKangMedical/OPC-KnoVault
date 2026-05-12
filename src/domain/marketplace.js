const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const assetTypes = new Set([
  "Document / Report",
  "Template / Methodology",
  "Dataset / Annotation Pack",
]);

const productionModes = new Set([
  "Human-authored",
  "AI-assisted",
  "Agent-executed",
]);

export function createMarketplace({ now = new Date().toISOString() } = {}) {
  return {
    now,
    opcs: [],
    assets: [],
    versions: [],
    subscriptions: [],
    feedback: [],
    trustEvents: [],
    counters: {
      opc: 0,
      asset: 0,
      version: 0,
      subscription: 0,
      feedback: 0,
      event: 0,
    },
  };
}

export function registerOpc(market, input) {
  requireWallet(input.wallet);
  if (!input.displayName || input.displayName.trim().length < 2) {
    throw new Error("OPC displayName is required");
  }
  if (!Array.isArray(input.samples) || input.samples.length < 3) {
    throw new Error("Verification Pack requires three Portfolio Samples");
  }
  if (findOpc(market, input.wallet)) {
    throw new Error("OPC wallet is already registered");
  }

  const counters = increment(market.counters, "opc");
  const opc = {
    id: `opc_${counters.opc}`,
    wallet: input.wallet,
    displayName: input.displayName.trim(),
    summary: input.summary?.trim() ?? "",
    samples: input.samples.map((sample) => sample.trim()).filter(Boolean),
    status: "pending-review",
  };

  return appendEvent({
    ...market,
    counters,
    opcs: [...market.opcs, opc],
  }, "OpcRegistered", { opcId: opc.id, wallet: opc.wallet });
}

export function approveOpc(market, wallet) {
  const opc = findOpcOrThrow(market, wallet);
  const opcs = market.opcs.map((candidate) => candidate.wallet === wallet
    ? { ...candidate, status: "verified" }
    : candidate);

  return appendEvent({ ...market, opcs }, "OpcVerified", {
    opcId: opc.id,
    wallet,
  });
}

export function createKnowledgeAsset(market, input) {
  const owner = findOpcOrThrow(market, input.ownerWallet);
  if (owner.status !== "verified") {
    throw new Error("Only a Verified OPC can publish Knowledge Assets");
  }
  if (!assetTypes.has(input.type)) {
    throw new Error("Unsupported Knowledge Asset type");
  }
  if (!productionModes.has(input.productionMode)) {
    throw new Error("Unsupported production mode");
  }
  if (!input.title || input.title.trim().length < 4) {
    throw new Error("Knowledge Asset title is required");
  }
  if (!Number.isFinite(input.priceMon) || input.priceMon <= 0) {
    throw new Error("Knowledge Asset price must be positive");
  }

  const counters = increment(market.counters, "asset");
  const asset = {
    id: `asset_${counters.asset}`,
    ownerWallet: input.ownerWallet,
    title: input.title.trim(),
    type: input.type,
    productionMode: input.productionMode,
    summary: input.summary?.trim() ?? "",
    preview: input.preview?.trim() ?? "",
    priceMon: normalizeMon(input.priceMon),
    updateCadence: input.updateCadence?.trim() ?? "Monthly",
    status: "listed",
    activeVersionId: null,
  };

  return appendEvent({
    ...market,
    counters,
    assets: [...market.assets, asset],
  }, "KnowledgeAssetRegistered", {
    assetId: asset.id,
    ownerWallet: asset.ownerWallet,
    type: asset.type,
  });
}

export function publishVersion(market, input) {
  const asset = findAssetOrThrow(market, input.assetId);
  if (!input.uri || !input.uri.includes("://")) {
    throw new Error("Version URI must be a content-addressed or external URI");
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(input.contentHash)) {
    throw new Error("Version contentHash must be a bytes32 hex value");
  }

  const counters = increment(market.counters, "version");
  const version = {
    id: `version_${counters.version}`,
    assetId: asset.id,
    uri: input.uri,
    contentHash: input.contentHash,
    notes: input.notes?.trim() ?? "",
    publishedAt: input.publishedAt ?? market.now,
  };
  const assets = market.assets.map((candidate) => candidate.id === asset.id
    ? { ...candidate, activeVersionId: version.id }
    : candidate);

  return appendEvent({
    ...market,
    counters,
    assets,
    versions: [...market.versions, version],
  }, "AssetVersionPublished", {
    assetId: asset.id,
    versionId: version.id,
    contentHash: version.contentHash,
    uri: version.uri,
  });
}

export function subscribeToAsset(market, input) {
  requireWallet(input.buyerWallet);
  const asset = findAssetOrThrow(market, input.assetId);
  if (!asset.activeVersionId) {
    throw new Error("Knowledge Asset must have an Active Version before subscription");
  }
  if (normalizeMon(input.amountMon) !== asset.priceMon) {
    throw new Error("Subscription amount must match the Knowledge Asset price");
  }

  const now = new Date(input.now ?? market.now);
  const expiresAt = new Date(now.getTime() + THIRTY_DAYS_MS).toISOString();
  const platformFeeMon = normalizeMon(asset.priceMon * 0.08);
  const sellerAmountMon = normalizeMon(asset.priceMon - platformFeeMon);
  const counters = increment(market.counters, "subscription");
  const subscription = {
    id: `subscription_${counters.subscription}`,
    assetId: asset.id,
    buyerWallet: input.buyerWallet,
    activeVersionId: asset.activeVersionId,
    amountMon: asset.priceMon,
    startsAt: now.toISOString(),
    expiresAt,
    escrow: {
      status: "held",
      platformFeeMon,
      sellerAmountMon,
    },
  };

  return appendEvent({
    ...market,
    counters,
    subscriptions: [...market.subscriptions, subscription],
  }, "SubscriptionPurchased", {
    assetId: asset.id,
    subscriptionId: subscription.id,
    buyerWallet: input.buyerWallet,
    activeVersionId: asset.activeVersionId,
    amountMon: subscription.amountMon,
  });
}

export function getContentAccess(market, input) {
  const subscription = [...market.subscriptions]
    .reverse()
    .find((candidate) => candidate.assetId === input.assetId && candidate.buyerWallet === input.wallet);
  if (!subscription) {
    return { status: "none", metadataVisible: true, bodyVisible: false };
  }

  const now = new Date(input.now ?? market.now);
  const expiresAt = new Date(subscription.expiresAt);
  const active = now.getTime() <= expiresAt.getTime();
  return {
    status: active ? "active" : "expired",
    metadataVisible: true,
    bodyVisible: active,
    subscriptionId: subscription.id,
    activeVersionId: subscription.activeVersionId,
    expiresAt: subscription.expiresAt,
  };
}

export function submitStructuredFeedback(market, input) {
  const access = getContentAccess(market, {
    assetId: input.assetId,
    wallet: input.buyerWallet,
    now: input.now ?? market.now,
  });
  if (access.status === "none") {
    throw new Error("Only subscribers can submit Structured Feedback");
  }

  const fields = [input.usefulness, input.accuracy, input.updateValue];
  if (fields.some((field) => !Number.isInteger(field) || field < 1 || field > 5)) {
    throw new Error("Structured Feedback scores must be integers from 1 to 5");
  }

  const counters = increment(market.counters, "feedback");
  const score = Math.round((fields.reduce((sum, field) => sum + field, 0) / fields.length) * 10) / 10;
  const feedback = {
    id: `feedback_${counters.feedback}`,
    assetId: input.assetId,
    buyerWallet: input.buyerWallet,
    usefulness: input.usefulness,
    accuracy: input.accuracy,
    updateValue: input.updateValue,
    score,
    comment: input.comment?.trim() ?? "",
    submittedAt: input.submittedAt ?? market.now,
  };

  return appendEvent({
    ...market,
    counters,
    feedback: [...market.feedback, feedback],
  }, "StructuredFeedbackSubmitted", {
    assetId: input.assetId,
    feedbackId: feedback.id,
    buyerWallet: input.buyerWallet,
    score,
  });
}

export function getAssetReputation(market, assetId) {
  const rows = market.feedback.filter((entry) => entry.assetId === assetId);
  if (rows.length === 0) {
    return { count: 0, averageScore: null };
  }
  const averageScore = Math.round((rows.reduce((sum, row) => sum + row.score, 0) / rows.length) * 10) / 10;
  return { count: rows.length, averageScore };
}

function appendEvent(market, type, payload) {
  const counters = increment(market.counters, "event");
  const event = {
    id: `event_${counters.event}`,
    type,
    payload,
    recordedAt: market.now,
  };
  return {
    ...market,
    counters,
    trustEvents: [...market.trustEvents, event],
  };
}

function increment(counters, key) {
  return { ...counters, [key]: counters[key] + 1 };
}

function findOpc(market, wallet) {
  return market.opcs.find((opc) => opc.wallet === wallet);
}

function findOpcOrThrow(market, wallet) {
  const opc = findOpc(market, wallet);
  if (!opc) {
    throw new Error("OPC does not exist");
  }
  return opc;
}

function findAssetOrThrow(market, assetId) {
  const asset = market.assets.find((candidate) => candidate.id === assetId);
  if (!asset) {
    throw new Error("Knowledge Asset does not exist");
  }
  return asset;
}

function normalizeMon(value) {
  return Math.round(Number(value) * 1000000) / 1000000;
}

function requireWallet(wallet) {
  if (!wallet || !wallet.startsWith("0x") || wallet.length < 10) {
    throw new Error("Wallet address is required");
  }
}
