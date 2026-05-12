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
- Monad testnet balance checked on 2026-05-12: `0`
- Faucet: `https://testnet.monad.xyz`
- Monad Testnet: chain ID `10143`, hex `0x279F`, RPC `https://testnet-rpc.monad.xyz`

The contract is ready to deploy after this address receives Monad testnet MON.

## Next Deploy Command

```bash
cd contracts
PRIVATE_KEY=$(cast wallet decrypt-keystore \
  --keystore-dir ~/.monskills/keystore \
  7f1bd49c-0a07-4e84-a4ae-e6c304635d52 \
  --unsafe-password "" | awk '{print $NF}')

forge script script/DeployOPCMarket.s.sol \
  --rpc-url https://testnet-rpc.monad.xyz \
  --chain 10143 \
  --broadcast \
  --private-key "$PRIVATE_KEY"
```

After deployment, set:

```bash
NEXT_PUBLIC_OPC_MARKET_ADDRESS=0xDEPLOYED_CONTRACT
```
