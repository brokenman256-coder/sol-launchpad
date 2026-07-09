"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, PlusCircle, Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export function MobileNav() {
  const path = usePathname();
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const short = publicKey
    ? `${publicKey.toBase58().slice(0, 4)}…`
    : "Wallet";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-[#1f1f1f] bg-black/95 backdrop-blur-md sm:hidden">
      <Link
        href="/"
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
          path === "/" ? "text-[#86efac]" : "text-[#666]"
        }`}
      >
        <Home size={20} strokeWidth={path === "/" ? 2.4 : 2} />
        Home
      </Link>
      <Link
        href="/create"
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
          path === "/create" ? "text-[#86efac]" : "text-[#666]"
        }`}
      >
        <PlusCircle size={20} strokeWidth={path === "/create" ? 2.4 : 2} />
        Create
      </Link>
      <button
        type="button"
        onClick={() => setVisible(true)}
        className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
          connected ? "text-[#86efac]" : "text-[#666]"
        }`}
      >
        <Wallet size={20} strokeWidth={connected ? 2.4 : 2} />
        {connected ? short : "Phantom"}
      </button>
    </nav>
  );
}
