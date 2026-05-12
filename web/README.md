# OPC KnoVault Web

Next.js frontend for OPC KnoVault, the OPC Platform trusted knowledge asset marketplace.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

```bash
cp .env.example .env.local
```

```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_OPC_MARKET_ADDRESS=0x7BF016e8f9bBC6998BB15Ed8238052ed94d44C56
```

If `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is empty, the app intentionally exposes only injected browser wallets such as MetaMask.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```
