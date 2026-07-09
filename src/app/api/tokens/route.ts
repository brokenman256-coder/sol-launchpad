import { NextResponse } from "next/server";
import seedTokens from "@/lib/seed-tokens";

export async function GET() {
  return NextResponse.json({ tokens: seedTokens });
}
