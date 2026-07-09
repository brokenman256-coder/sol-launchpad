"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";
import { PumpLogo } from "./PumpLogo";
import { WalletButton } from "@/components/wallet/WalletButton";

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/");
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#1f1f1f] bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-3 sm:gap-4 sm:px-6">
        <PumpLogo />

        <form onSubmit={handleSearch} className="hidden flex-1 sm:block sm:max-w-md">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for token"
              className="w-full rounded-full border border-[#1f1f1f] bg-[#111] py-2 pl-10 pr-4 text-sm text-white outline-none placeholder:text-[#555] focus:border-[#86efac]/50 focus:bg-[#141414]"
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
