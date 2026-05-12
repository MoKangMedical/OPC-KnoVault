# OPC Trust Market Indexer

This folder is indexer-ready for Envio HyperIndex on Monad testnet.

The real Envio `contract-import` step must run after `OPCTrustMarket` is deployed and verified:

```bash
pnpx envio@3.0.0-alpha.21 init contract-import explorer \
  -b monad-testnet \
  -c <OPC_TRUST_MARKET_ADDRESS> \
  -n OPCTrustMarket \
  -l typescript \
  -d ./ -o ./ \
  --all-events --single-contract --api-token ""
```

After import, keep the entity shapes from `schema.graphql` and merge the handlers from `src/EventHandlers.ts`.

Prerequisites for Envio Cloud deploy are user-owned:

- `npm install -g envio-cloud`
- `envio-cloud login`
- GitHub CLI installed and logged in
- Contract verified on a Monad explorer
