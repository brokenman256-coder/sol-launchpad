"use client";

import { ReactNode } from "react";
import { WalletProvider } from "@/components/wallet/WalletProvider";

export function Providers({ children }: { children: ReactNode }) {
  return <WalletProvider>{children}</WalletProvider>;
}
