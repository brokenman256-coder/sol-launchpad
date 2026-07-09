import { NextRequest, NextResponse } from "next/server";
import { getComments, getToken, getTrades } from "@/lib/store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const token = getToken(mint);

  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const comments = getComments(mint);
  const trades = getTrades(mint);
  return NextResponse.json({ token, comments, trades });
}
