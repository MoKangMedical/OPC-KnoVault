import test from "node:test";
import assert from "node:assert/strict";
import {
  approveOpc,
  createKnowledgeAsset,
  createMarketplace,
  getContentAccess,
  publishVersion,
  registerOpc,
  submitStructuredFeedback,
  subscribeToAsset,
} from "../src/domain/marketplace.js";

test("a Verified OPC can publish a Knowledge Asset and a buyer can complete a verifiable subscription", () => {
  let market = createMarketplace({ now: "2026-05-12T00:00:00.000Z" });

  market = registerOpc(market, {
    wallet: "0xOPC000000000000000000000000000000000001",
    displayName: "Lian Harbor Research",
    summary: "Independent operator publishing AI market research packs.",
    samples: ["AI pricing teardown", "Onchain GTM memo", "Dataset sourcing guide"],
  });

  market = approveOpc(market, "0xOPC000000000000000000000000000000000001");

  market = createKnowledgeAsset(market, {
    ownerWallet: "0xOPC000000000000000000000000000000000001",
    title: "AI Agent GTM Playbook",
    type: "Template / Methodology",
    productionMode: "AI-assisted",
    summary: "A reusable go-to-market method for agent products.",
    preview: "Includes positioning map, pricing checkpoints, and launch sequencing.",
    priceMon: 8.5,
    updateCadence: "Monthly",
  });

  const assetId = market.assets[0].id;
  market = publishVersion(market, {
    assetId,
    uri: "ipfs://bafy-agent-gtm-v1",
    contentHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
    notes: "Initial public version",
  });

  market = subscribeToAsset(market, {
    assetId,
    buyerWallet: "0xBUYER0000000000000000000000000000000001",
    amountMon: 8.5,
    now: "2026-05-12T00:00:00.000Z",
  });

  assert.equal(getContentAccess(market, {
    assetId,
    wallet: "0xBUYER0000000000000000000000000000000001",
    now: "2026-05-20T00:00:00.000Z",
  }).status, "active");

  assert.equal(getContentAccess(market, {
    assetId,
    wallet: "0xBUYER0000000000000000000000000000000001",
    now: "2026-06-20T00:00:00.000Z",
  }).status, "expired");

  market = submitStructuredFeedback(market, {
    assetId,
    buyerWallet: "0xBUYER0000000000000000000000000000000001",
    usefulness: 5,
    accuracy: 4,
    updateValue: 5,
    comment: "The methodology was immediately usable for a launch plan.",
  });

  assert.deepEqual(market.trustEvents.map((event) => event.type), [
    "OpcRegistered",
    "OpcVerified",
    "KnowledgeAssetRegistered",
    "AssetVersionPublished",
    "SubscriptionCreated",
    "FeedbackSubmitted",
  ]);
  assert.equal(market.subscriptions[0].escrow.status, "held");
  assert.equal(market.subscriptions[0].escrow.platformFeeMon, 0.2125);
  assert.equal(market.subscriptions[0].escrow.sellerAmountMon, 8.2875);
  assert.equal(market.feedback[0].score, 4.7);
});

test("unverified OPCs cannot publish Knowledge Assets", () => {
  let market = createMarketplace();
  market = registerOpc(market, {
    wallet: "0xUNVERIFIED00000000000000000000000000001",
    displayName: "Draft Studio",
    summary: "Draft seller",
    samples: ["Sample one", "Sample two", "Sample three"],
  });

  assert.throws(() => createKnowledgeAsset(market, {
    ownerWallet: "0xUNVERIFIED00000000000000000000000000001",
    title: "Private Dataset",
    type: "Dataset / Annotation Pack",
    productionMode: "Human-authored",
    summary: "A private dataset.",
    preview: "Schema only.",
    priceMon: 4,
    updateCadence: "Quarterly",
  }), /Verified OPC/);
});

test("subscription amount must match the Knowledge Asset price", () => {
  let market = createMarketplace();
  market = registerOpc(market, {
    wallet: "0xSELLER000000000000000000000000000000001",
    displayName: "Northline Notes",
    summary: "Independent research desk.",
    samples: ["Sample one", "Sample two", "Sample three"],
  });
  market = approveOpc(market, "0xSELLER000000000000000000000000000000001");
  market = createKnowledgeAsset(market, {
    ownerWallet: "0xSELLER000000000000000000000000000000001",
    title: "Commerce Research Pack",
    type: "Document / Report",
    productionMode: "Human-authored",
    summary: "Research pack.",
    preview: "Sample page.",
    priceMon: 6,
    updateCadence: "Monthly",
  });
  market = publishVersion(market, {
    assetId: market.assets[0].id,
    uri: "ipfs://commerce-v1",
    contentHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
    notes: "Initial version",
  });

  assert.throws(() => subscribeToAsset(market, {
    assetId: market.assets[0].id,
    buyerWallet: "0xBUYER0000000000000000000000000000000002",
    amountMon: 5,
  }), /price/);
});
