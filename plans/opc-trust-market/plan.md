# OPC Trust Market MVP

**Branch:** `codex/opc-trust-market-mvp`
**Description:** Build a hackathon-ready MVP for a Monad-backed OPC knowledge asset subscription market.

## Goal

Implement the first verifiable Knowledge Asset subscription transaction: a Verified OPC publishes an asset, a buyer subscribes with Monad Native Token, and the app records asset, version, subscription, and reputation Trust Events.

## Implementation Steps

### Step 1: Domain Core With TDD
**Files:** `src/domain/marketplace.js`, `tests/marketplace.test.js`, `package.json`
**What:** Build a dependency-free marketplace domain module for OPC verification, Knowledge Asset creation, version publishing, subscription access, escrow settlement, and Structured Feedback.
**Testing:** Node's built-in test runner verifies observable behavior through the public domain API.

### Step 2: Real Monad Testnet Frontend
**Files:** `web/app/**`, `web/components/**`, `web/lib/**`
**What:** Build a Next.js dApp with RainbowKit, Wagmi, and viem. The UI connects wallet accounts, enforces Monad testnet, separates chainless platform review from contract verification, and lets buyers submit real payable subscription transactions.
**Testing:** TypeScript check, Next production build, and manual wallet verification on Monad testnet after a contract address is configured.

### Step 3: Monad Contract Project
**Files:** `contracts/OPCTrustMarket.sol`, `foundry.toml`, `contracts/README.md`
**What:** Add a Foundry-compatible contract that verifies OPC wallets, registers assets, publishes version hashes, accepts native MON subscriptions, emits trust events, and handles first-term escrow release/refund paths.
**Testing:** Static Solidity review in this environment; run `forge build` after Foundry is installed locally.

### Step 4: Project Documentation
**Files:** `README.md`, existing PRD and context docs
**What:** Document Monad testnet chain id, environment variables, contract deployment, wallet flow, and the remaining indexer gap.
**Testing:** Run `npm test`, `npm run typecheck`, and `npm run build`.
