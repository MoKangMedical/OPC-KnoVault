import "@rainbow-me/rainbowkit/styles.css";
import "./styles.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "OPC Trust Market",
  description: "Monad testnet market for verifiable OPC knowledge subscriptions.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
