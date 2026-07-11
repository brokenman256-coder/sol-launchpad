import { PumpLogo } from "./PumpLogo";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-14 border-t border-white/[0.06] py-10 pb-24 sm:pb-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-4 sm:flex-row sm:px-6">
        <PumpLogo size="sm" />
        <p className="max-w-md text-center text-xs text-[#444] sm:text-left">
          © 2026 pump.fun beta — Fair launches on Solana. Coins can move fast.
          Do your own research.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-[#555]">
          <Link href="/?view=dex" className="hover:text-[#86efac]">
            DEX Screener
          </Link>
          <span className="text-[#2a2a2a]">|</span>
          <Link href="/create" className="hover:text-[#86efac]">
            Launch
          </Link>
          <span className="text-[#2a2a2a]">|</span>
          <Link href="/admin" className="hover:text-[#86efac]">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
