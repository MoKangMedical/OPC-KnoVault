import type { LucideIcon } from "lucide-react";

export type AssetType =
  | "Document / Report"
  | "Template / Methodology"
  | "Dataset / Annotation";

export type ProductionMode = "Human-authored" | "AI-assisted" | "Agent-executed";

export type CapabilityAsset = {
  id: number;
  type: AssetType;
  title: string;
  seller: string;
  handle: string;
  summary: string;
  preview: string;
  proof: string;
  price: string;
  duration: string;
  currentVersion: string;
  updateFrequency: string;
  productionMode: ProductionMode;
  rating: number;
  subscriptions: number;
  match: number;
  tags: string[];
};

export type BuyerIntent = {
  id: number;
  buyer: string;
  title: string;
  budget: string;
  category: AssetType;
  need: string;
  matchAssetId: number;
};

export type OpportunityTemplate = {
  id: string;
  title: string;
  buyer: string;
  market: string;
  budget: string;
  cycle: string;
  summary: string;
  capabilities: string[];
  recommendedAssetId: number;
};

export type MatchSignal = {
  assetId: number;
  score: number;
  reason: string;
  trust: string;
  risk: string;
  suggestion: string;
  intentSummary: string;
};

export type SubscriptionStatus = "Preview" | "Subscribed" | "Feedback" | "Released";

export type Subscription = {
  id: string;
  assetId: number;
  title: string;
  buyer: string;
  seller: string;
  value: string;
  status: SubscriptionStatus;
  evidence: string;
};

export type NavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
};
