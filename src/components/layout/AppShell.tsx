"use client";

import { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileNav } from "./MobileNav";
import { WelcomeModal } from "../ui/WelcomeModal";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-6 sm:py-5">{children}</main>
      <Footer />
      <MobileNav />
      <WelcomeModal />
    </div>
  );
}
