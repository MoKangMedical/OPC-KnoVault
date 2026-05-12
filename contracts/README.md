# OPCMarket Contracts

`OPCMarket` is the Monad trust-event and first-term escrow layer for OPC KnoVault.

The contract is scoped to Knowledge Asset subscriptions:

- Platform owner verifies OPC sellers.
- Verified OPCs register assets and publish version hashes.
- Buyers subscribe with MON and receive an access commitment.
- Buyers can submit structured feedback.
- First-term payment can be released with a platform fee or disputed and refunded by platform review.

## Monad Networks

- Testnet chain ID: `10143`
- Mainnet chain ID: `143`
- Testnet RPC: `https://testnet-rpc.monad.xyz`
- Mainnet RPC: `https://rpc.monad.xyz`

## Contract Surface

- `verifyOPC(opc, verificationHash, uri)`
- `revokeOPC(opc)`
- `registerAsset(assetHash, assetURI, assetType, productionMode, price, subscriptionDuration, versionHash, versionURI)`
- `publishVersion(assetId, versionHash, versionURI)`
- `setAssetActive(assetId, active)`
- `subscribe(assetId, accessHash, accessURI)`
- `submitFeedback(subscriptionId, rating, feedbackHash, feedbackURI)`
- `approveFirstTerm(subscriptionId)`
- `requestRefund(subscriptionId, disputeHash, disputeURI)`
- `resolveDispute(subscriptionId, refundBuyer)`

Default deployment uses `250` basis points, or a 2.5% platform fee.

## Setup

Foundry is installed in this environment as `forge 1.7.1` / `cast 1.7.1`.

```bash
cd contracts
forge install --no-git OpenZeppelin/openzeppelin-contracts
forge install --no-git foundry-rs/forge-std
forge build
forge test
```

## Deploy to Monad Testnet

```bash
cd contracts
forge script script/DeployOPCMarket.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --chain 10143 \
  --broadcast
```

After deployment, set the frontend variable:

```bash
NEXT_PUBLIC_OPC_MARKET_ADDRESS=0x...
```

## Verify

Use the monskills verification API after deployment.

```bash
forge verify-contract <ADDR> src/OPCMarket.sol:OPCMarket \
  --constructor-args $(cast abi-encode "constructor(uint16)" 250) \
  --chain 10143 \
  --show-standard-json-input > /tmp/standard-input.json

cat out/OPCMarket.sol/OPCMarket.json | jq '.metadata' > /tmp/metadata.json
```

Then POST `standardJsonInput` and `foundryMetadata` to `https://agents.devnads.com/v1/verify`.
