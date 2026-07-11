import { NextRequest, NextResponse } from "next/server";
import { createToken, getAllTokens } from "@/lib/store";
import type { SortOption } from "@/lib/types";

const SORTS: SortOption[] = [
  "new",
  "market_cap",
  "volume",
  "trending",
  "gainers",
];

export async function GET(req: NextRequest) {
  const sortParam = req.nextUrl.searchParams.get("sort") ?? "new";
  const sort = (SORTS.includes(sortParam as SortOption)
    ? sortParam
    : "new") as SortOption;

  const tokens = getAllTokens(sort);
  return NextResponse.json({ tokens, count: tokens.length, sort });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, symbol, description, imageUrl, creator, website, twitter, telegram } =
      body ?? {};

    if (!name || !symbol || !creator) {
      return NextResponse.json(
        { error: "name, symbol, and creator are required" },
        { status: 400 },
      );
    }

    const hasSocials = Boolean(website || twitter || telegram);
    const token = createToken({
      name: String(name).slice(0, 32),
      symbol: String(symbol).slice(0, 10),
      description: String(description ?? "").slice(0, 280),
      imageUrl: String(imageUrl ?? ""),
      creator: String(creator),
      website: website ? String(website) : undefined,
      twitter: twitter ? String(twitter) : undefined,
      telegram: telegram ? String(telegram) : undefined,
      verified: hasSocials,
    });

    return NextResponse.json({ token }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create token";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
