# Five-Minute Demo Script

The Notion package says each team has 5 minutes, and the demo should prioritize a live product running on Monad testnet. Slides are optional.

## 0:00 - 0:45 Problem

AI-era one-person companies can produce high-value reports, templates, methods, and datasets, but buyers still lack a credible way to compare, subscribe to, and audit those knowledge assets.

OPC KnoVault is the trusted subscription layer for this workflow: asset-first discovery, verified OPC supply, Monad-backed trust events, and first-term escrow.

## 0:45 - 2:00 Live Asset Page

Show the marketplace:

- AI 需求匹配台: pick a Monad / China market-entry opportunity template and show the recommended asset.
- Agent output: match reason, trust evidence, risk note, collaboration suggestion, and intent summary hash.
- Knowledge Assets: Document / Report, Template / Methodology, Dataset / Annotation Pack.
- Asset page as the main entry, not the seller profile.
- Free preview, Verified OPC badge, production mode, update cadence, current version, and version hash.

Key line: AI handles discovery and explanation; Monad handles provenance, version, subscription, feedback, and settlement events.

## 2:00 - 3:20 Live Subscription

Connect wallet, select an asset, then click "订阅当前版本".

Explain the Monad contract lifecycle:

- Platform verifies the OPC before publishing.
- OPC registers asset metadata and publishes a version hash.
- Buyer subscribes with MON and receives content access.
- First-term funds remain in escrow for refund/dispute handling.
- Buyer submits structured feedback.
- Buyer or platform releases first-term funds; platform fee is split automatically.

Show the subscription record and status changing in the UI.

## 3:20 - 4:20 Technical Architecture

Onchain:

- OPC verification record.
- Asset commitment.
- Version event.
- Subscription escrow and access record.
- Structured feedback / reputation event.
- Approval, platform fee release, dispute, and refund status.

Offchain:

- Full Markdown/PDF/dataset content.
- Free preview rendering.
- Portfolio sample and manual review material.
- Search, category browsing, and scoring.
- Reputation aggregation.

Monad fit:

- EVM tooling with Foundry, viem, wagmi, RainbowKit.
- Fast confirmation path for subscription UX.
- Event logs can feed an indexer for asset history, subscriber history, and reputation.

## 4:20 - 5:00 Business Model

OPC KnoVault can charge:

- Platform fee on each subscription.
- Verification and asset review fee for OPCs.
- Premium analytics and reputation tools.
- Buyer-side saved searches and monitored update feeds.

Close with the core claim: "This is the trusted transaction layer for AI-era OPC knowledge assets."

## Backup Plan

Prepare these before demo:

- A screenshot of the Knowledge Asset page.
- A screenshot of the subscription / feedback path.
- A short screen recording of the subscribe click path.
- Contract test output showing the lifecycle passes.
