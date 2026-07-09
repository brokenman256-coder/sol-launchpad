"use client";

import { useMemo, useCallback, ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork, WalletError } from "@solana/wallet-adapter-base";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

function resolveNetwork(): WalletAdapterNetwork {
  const c = process.env.NEXT_PUBLIC_CLUSTER ?? "devnet";
  if (c === "mainnet-beta") return WalletAdapterNetwork.Mainnet;
  if (c === "testnet") return WalletAdapterNetwork.Testnet;
  return WalletAdapterNetwork.Devnet;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const network = resolveNetwork();
  const endpoint = useMemo(
    () => process.env.NEXT_PUBLIC_RPC_URL ?? clusterApiUrl(network),
    [network],
  );

  // Phantom is first so it is the default pick when available
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network })],
    [network],
  );

  const onError = useCallback((error: WalletError) => {
    // Avoid crashing the app on user-rejected connections
    if (error?.name === "WalletConnectionError") return;
    if (error?.message?.toLowerCase().includes("user rejected")) return;
    console.error("[wallet]", error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: "confirmed" }}>
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect
        onError={onError}
        localStorageKey="pump.fun-wallet"
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
