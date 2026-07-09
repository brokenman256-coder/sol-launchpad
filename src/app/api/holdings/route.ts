import { NextRequest, NextResponse } from "next/server";
import { getHolding, getWalletHoldings } from "@/lib/holdings";

export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  const mint = req.nextUrl.searchParams.get("mint");

  if (!wallet) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }

  if (mint) {
    return NextResponse.json({ wallet, mint, balance: getHolding(wallet, mint) });
  }

  return NextResponse.json({ wallet, holdings: getWalletHoldings(wallet) });
}
