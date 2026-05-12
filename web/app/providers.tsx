"use client";

import { RainbowKitProvider, connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet } from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { monadTestnet } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ??
  "1f4f0d8c2c7a4b7fa7df56c5f2a8c7b2";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Browser wallet",
      wallets: [injectedWallet],
    },
  ],
  {
    appName: "OPC Trust Market",
    projectId,
  },
);

const config = createConfig({
  chains: [monadTestnet],
  connectors,
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
  },
  ssr: true,
});

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
