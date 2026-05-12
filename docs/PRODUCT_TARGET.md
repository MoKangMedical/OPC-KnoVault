# Product Target

## Positioning

OPC KnoVault is a trusted knowledge-asset subscription market for AI-era OPCs and small teams.

The v1 product turns reports, templates, methodologies, and dataset / annotation packs into verifiable subscription assets. The main entry is the asset page, not the seller profile. Monad stores trust events; full content and review materials stay offchain.

## Final Scope Decision

`OPC-Match-PRD.md` describes the broader opportunity network: demand posting, AI matching, OPC profiles, teams, and Intent Proof. `PRD.zh.md` describes the narrower transaction layer: Verified OPC, Knowledge Asset, subscription, version, feedback, and escrow.

The final hackathon product uses the narrower transaction layer as the core. OPC Match becomes the future discovery layer that can route buyers into a transaction. The first tradable unit is therefore **Knowledge Asset Subscription**, not a job, not a freelancer profile, and not an open-ended service contract.

## PRD Decisions

- v1 sells Knowledge Assets, not general freelance services.
- Default asset types are Document / Report, Template / Methodology, and Dataset / Annotation Pack.
- Buyers purchase usage right and content access, not ownership, resale rights, or transfer rights.
- Asset production mode must disclose Human-authored, AI-assisted, or Agent-executed.
- The transaction model is Subscription Access, not permanent purchase.
- Buyers subscribe with Monad native token.
- Only Verified OPCs can publish assets.
- Verification is a platform review pack: wallet registration, portfolio sample, and manual review material.
- Free preview includes summary, sample page, and verification state; complete content stays gated.
- Active subscribers access the current effective version during the subscription period.
- Expired subscribers keep metadata and purchase history, but lose full content access.
- First-term subscription payment is escrowed for refund/dispute handling.
- Refund is available only when content clearly mismatches the asset description.
- Disputes use platform review, not community arbitration.
- Reputation starts as structured feedback and Reputation Events, not long-form community comments.

## Grill-Me Decisions

Question: If the hackathon demo can prove only one thing, what should it prove?

Recommended answer: A Verified OPC can publish a knowledge asset, a buyer can subscribe with MON, and Monad records asset, version, subscription, feedback, and escrow events.

Question: What is the smallest wedge?

Recommended answer: Not a full marketplace. The wedge is "Verified OPC + Knowledge Asset page + subscription escrow + structured feedback."

Question: What should not be onchain?

Recommended answer: Full documents, PDFs, datasets, search ranking, preview rendering, manual review material, and reputation scoring stay offchain. Monad stores commitments, state, and settlement.

Question: What does the buyer trust?

Recommended answer: The buyer trusts the platform's verified supply gate, free preview, version hash, subscription record, first-term refund path, and structured reputation events.

Question: What does the seller trust?

Recommended answer: The seller gets a funded subscription before exposing full content and has an explicit first-term release path after review.

## Demo Flow

1. Browse Knowledge Assets by category and search.
2. Open an asset page with free preview, Verified OPC badge, production mode, update cadence, and version hash.
3. Connect wallet.
4. Subscribe to the current version with MON.
5. Show local subscription/access record and Monad trust-event contract wiring.
6. Submit structured feedback and release first-term escrow, or show refund/dispute path.

## Competition Constraints From Notion

- Submission deadline is 6:30 PM.
- Demo window is 7:00 PM - 8:00 PM.
- Team size is at most 3.
- Code and assets must start during the official Blitz window.
- Public GitHub, public frontend preview, and Monad deployment are required for review.
- Submit on MOJO with logo, preview image, detailed introduction, working preview link, and GitHub link.

## Monad Implementation Notes

- Use Monad Testnet first: chain ID `10143`.
- Use `wagmi/chains` `monadTestnet` and `monad`.
- Use `viem >= 2.40.0`; this repo currently uses `viem 2.48.x`.
- Set explicit gas for known frontend calls because Monad charges by gas limit.
- Do not use onchain arrays for marketplace feeds; consume events through an indexer after deployment.
- Current contract functions aligned to the PRD: `verifyOPC`, `registerAsset`, `publishVersion`, `subscribe`, `submitFeedback`, `approveFirstTerm`, `requestRefund`, and `resolveDispute`.
