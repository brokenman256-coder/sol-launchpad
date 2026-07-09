import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { getConfig } from "@/lib/store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const config = getConfig();

export const metadata: Metadata = {
  title: "pump.fun beta — Launch and trade memecoins on Solana",
  description: config.brand.tagline,
  openGraph: {
    title: "pump.fun beta",
    description: "pump.fun beta — Launch and trade memecoins on Solana",
    siteName: "pump.fun beta",
  },
  twitter: { card: "summary_large_image", title: "pump.fun beta" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className={`${geistSans.className} min-h-full antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
