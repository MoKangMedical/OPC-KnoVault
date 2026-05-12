# OPC KnoVault

OPC KnoVault is a Monad Blitz MVP for trusted knowledge-asset subscriptions in the one-person-company era.

Verified OPCs package reports, templates, methodologies, and dataset packs as verifiable assets. Buyers compare asset pages, preview samples, subscribe with MON, receive content access, and leave structured feedback. Monad records the trust events: OPC verification, asset existence, version publication, subscription, escrow release, refund dispute, and reputation feedback.

The current demo also includes an AI demand-matching console derived from the OPC Match / MONSKILLS workflow. Buyers choose an opportunity template, see the recommended Knowledge Asset, review match reasoning and risk notes, then continue into the subscription transaction.

## Hackathon Target

Build the smallest credible loop for an OPC knowledge subscription market:

1. Platform verifies an OPC from a wallet, portfolio sample, and manual review pack.
2. Verified OPC publishes a Knowledge Asset with metadata URI, asset hash, version hash, price, and subscription duration.
3. Buyer selects an opportunity template and AI recommends a matching Knowledge Asset with reasoning, trust evidence, risk notes, and an intent summary hash.
4. Buyer reviews the asset page, free preview, verification state, version record, and price.
5. Buyer subscribes with Monad native token; first-term payment is held in escrow.
6. Buyer submits structured feedback or requests a refund if the content clearly mismatches the description.
7. Platform releases the first-term payment with a platform fee, or resolves a dispute and refunds the buyer.

## Why Monad

- EVM-compatible development path with `wagmi`, `viem`, RainbowKit, and Foundry.
- Low-latency UX is useful for checkout, event confirmation, and repeated subscription activity.
- Chain IDs used by this repo: testnet `10143`, mainnet `143`.
- Monad is not a payment wrapper here. It is the trust-event layer for asset, version, subscription, feedback, escrow, and dispute records.

## Repo Layout

- `web/` Next.js app with RainbowKit wallet connect, asset-first marketplace UI, local demo state, and contract call wiring.
- `contracts/` Foundry contract for OPC verification, asset registration, version publication, subscription escrow, feedback, platform release, and refund review.
- `docs/` competition notes, product decisions, demo script, submission checklist, and MOJO case benchmark.

## Competition Readiness

- Demo script: `docs/DEMO_SCRIPT.md`
- Submission checklist: `docs/SUBMISSION_CHECKLIST.md`
- Final product model: `docs/FINAL_PRODUCT_MODEL.md`
- Notion brief summary: `docs/HACKATHON_BRIEF.md`
- MOJO case benchmark: `docs/MOJO_CASE_STUDY.md`
- Logo asset: `web/public/opc-knovault-logo.svg`

The 5-minute demo should start from the live app, show a Knowledge Asset page, subscribe with MON, then show Monad trust events and the first-term escrow / feedback path.

## Current MVP Boundary

Onchain:

- Verified OPC profile record
- Knowledge Asset commitment
- Current version hash and version event
- Subscription escrow and access record
- Structured feedback event
- Platform fee release and dispute refund

Offchain:

- Full asset content
- Markdown/PDF/dataset storage
- AI opportunity matching, search, category browsing, and previews
- Manual review materials
- Reputation scoring and ranking

## Local Run

```bash
cd web
npm run dev
```

Set wallet and contract variables in `web/.env.local` when available:

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_OPC_MARKET_ADDRESS=
```

Without `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`, the app intentionally exposes only injected browser wallets. Add a Reown / WalletConnect project id to enable QR and mobile wallet connection.

## Verification

```bash
cd web
npm run lint
npm run build

cd ../contracts
forge build
forge test -vvv
```
