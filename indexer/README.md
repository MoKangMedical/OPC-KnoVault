# OPC KnoVault Indexer

This folder is an Envio HyperIndex-ready template for the deployed `OPCMarket` contract on Monad Testnet.

Current demo contract:

```text
0x7BF016e8f9bBC6998BB15Ed8238052ed94d44C56
```

The frontend can run without an indexer by using the configured contract address and local demo state. Production should use this indexer to sync full historical trust events:

- `OPCVerified`
- `AssetRegistered`
- `AssetVersionPublished`
- `SubscriptionCreated`
- `FeedbackSubmitted`
- `FirstTermApproved`
- `SubscriptionDisputed`
- `DisputeResolved`

Import the deployed and verified contract ABI, then merge the entity shapes from `schema.graphql` and handlers from `src/EventHandlers.ts`.

```bash
pnpx envio init contract-import explorer \
  -b monad-testnet \
  -c 0x7BF016e8f9bBC6998BB15Ed8238052ed94d44C56 \
  -n OPCMarket \
  -l typescript \
  -d ./ -o ./ \
  --all-events --single-contract
```

Prerequisites for Envio Cloud deploy are user-owned:

- `npm install -g envio-cloud`
- `envio-cloud login`
- GitHub CLI installed and logged in
- Contract verified on a Monad explorer
