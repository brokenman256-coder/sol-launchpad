import { PumpLogo } from "./PumpLogo";

export function Footer() {
  return (
    <footer className="mt-12 border-t border-[#1f1f1f] py-8 pb-24 sm:pb-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <PumpLogo size="sm" />
        <p className="text-xs text-[#444]">
          © 2026 pump.fun beta — Launch and trade memecoins on Solana
        </p>
        <div className="flex gap-4 text-xs text-[#555]">
          <a href="/admin" className="hover:text-[#86efac]">
            Admin
          </a>
          <span className="text-[#2a2a2a]">|</span>
          <span>Trade carefully</span>
        </div>
      </div>
    </footer>
  );
}
