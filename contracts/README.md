# OPCTrustMarket on Monad Testnet

The MVP contract accepts native MON payments through `subscribe(assetId)` and emits the trust events used by the frontend.

## Prerequisites

Install Foundry first:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Build

```bash
forge build
```

## Deploy to Monad testnet

```bash
forge create contracts/OPCTrustMarket.sol:OPCTrustMarket \
  --rpc-url https://testnet-rpc.monad.xyz \
  --private-key $PRIVATE_KEY \
  --constructor-args $FEE_RECIPIENT
```

After deploy, put the address in:

```bash
web/.env.local
NEXT_PUBLIC_OPC_TRUST_MARKET_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

## Contract workflow

1. Platform owner calls `verifyOpc(opcWallet)`.
2. Verified OPC calls `registerAsset(assetType, productionMode, priceWei, metadataUri)`.
3. OPC calls `publishVersion(assetId, contentHash, uri)`.
4. Buyer calls `subscribe(assetId)` with native MON.
5. Seller calls `releaseMyEscrow(subscriptionId)` to receive the seller share in their wallet.
6. Buyer calls `submitStructuredFeedback(assetId, score)`.

The frontend syncs recent `KnowledgeAssetRegistered`, `AssetVersionPublished`, `SubscriptionPurchased`, and reputation events from Monad testnet. The `indexer/` folder contains Envio HyperIndex-ready files for full historical sync after the contract is deployed and verified.
