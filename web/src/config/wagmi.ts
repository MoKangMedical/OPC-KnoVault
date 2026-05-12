import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { injectedWallet, walletConnectWallet } from "@rainbow-me/rainbowkit/wallets";
import { http } from "wagmi";
import { monad, monadTestnet } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const wallets = [
  {
    groupName: projectId ? "Recommended" : "Browser wallet",
    wallets: projectId ? [injectedWallet, walletConnectWallet] : [injectedWallet],
  },
];

export const config = getDefaultConfig({
  appName: "OPC KnoVault",
  projectId: projectId || "local-only",
  wallets,
  chains: [monadTestnet, monad],
  ssr: true,
  transports: {
    [monadTestnet.id]: http("https://testnet-rpc.monad.xyz"),
    [monad.id]: http("https://rpc.monad.xyz"),
  },
});
