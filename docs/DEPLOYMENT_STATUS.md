# Deployment Status

## Foundry

- Installed: `forge 1.7.1`, `cast 1.7.1`.
- `forge build`: passing.
- `forge test -vvv`: passing, 6 tests.
- Deployment script initializes `OPCMarket(250)`, meaning a 2.5% platform fee.
- Deployment script now seeds 4 demo assets with low testnet prices: `0.018`, `0.009`, `0.026`, and `0.014` MON.

## Agent Wallet

- Keystore path: `~/.monskills/keystore/`
- Public address: `0x3bb6ABf7e443152041dDdaf10E878B4561798d47`
- Monad testnet balance checked after deployment on 2026-05-12: `0.158901668804420738`
- Faucet: `https://testnet.monad.xyz`
- Monad Testnet: chain ID `10143`, hex `0x279F`, RPC `https://testnet-rpc.monad.xyz`

## Deployed Contract

- Network: Monad Testnet
- Address: `0x7BF016e8f9bBC6998BB15Ed8238052ed94d44C56`
- Constructor: `OPCMarket(250)` / 2.5% platform fee
- Deploy transaction: `0xae76dc722449d84d3e33123dfd4e8acff277061ae48eab7effe5379755a6a400`
- Seed transactions registered 4 demo assets and published v1 for each asset.
- Chain read check: `nextAssetId() == 5`, `platformFeeBps() == 250`
- Pre-payment check on 2026-05-12: `nextSubscriptionId() == 1`
- Failed payment check: `0xba5c5656d55df8240a7d12fd3177be6e1fd8e8cb785e1831329daeddf6dd2f8a` consumed the old fixed `170000` gas cap and failed with `out of gas`. Frontend now lets the wallet/RPC estimate gas instead of hard-capping `subscribe`.

Frontend local env:

```bash
NEXT_PUBLIC_OPC_MARKET_ADDRESS=0x7BF016e8f9bBC6998BB15Ed8238052ed94d44C56
```

## Deploy Command Used

```bash
cd contracts
forge script script/DeployOPCMarket.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --chain 10143 \
  --broadcast \
  --private-key "$DEPLOYER_PRIVATE_KEY"
```

Do not commit `.env`, private keys, keystore passwords, or raw deployer credentials.

After deployment, set:

```bash
NEXT_PUBLIC_OPC_MARKET_ADDRESS=0xDEPLOYED_CONTRACT
```
