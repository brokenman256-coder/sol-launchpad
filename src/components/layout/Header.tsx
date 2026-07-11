"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { PumpLogo } from "./PumpLogo";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/");
    }
  }

  const nav = [
    { href: "/", label: "Launchpad" },
    { href: "/?view=dex", label: "DEX" },
    { href: "/create", label: "Create" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:gap-4 sm:px-6">
        <PumpLogo />

        <nav className="ml-1 hidden items-center gap-1 md:flex">
          {nav.map((n) => {
            const active =
              n.href === "/"
                ? pathname === "/"
                : n.href.startsWith("/create")
                  ? pathname.startsWith("/create")
                  : false;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  active
                    ? "bg-white/10 text-white"
                    : "text-[#777] hover:bg-white/5 hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        <form onSubmit={handleSearch} className="hidden flex-1 sm:block sm:max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search token, ticker, mint…"
              className="w-full rounded-full border border-white/5 bg-[#111] py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#555] focus:border-[#86efac]/40 focus:bg-[#141414] focus:ring-2 focus:ring-[#86efac]/10"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <Link
            href="/create"
            className="pump-btn hidden px-4 py-2 text-sm sm:inline-flex"
          >
            Create coin
          </Link>
          <Link href="/create" className="pump-btn px-3 py-1.5 text-xs sm:hidden">
            Create
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
