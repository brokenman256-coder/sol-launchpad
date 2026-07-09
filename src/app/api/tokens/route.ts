import { NextRequest, NextResponse } from "next/server";
import { createToken, getAllTokens, getConfig } from "@/lib/store";
import type { SortOption } from "@/lib/types";
import {
  markSignatureUsed,
  verifySolPayment,
} from "@/lib/solana/verify-payment";
import { isPlaceholderAddress } from "@/lib/solana/constants";

export async function GET(req: NextRequest) {
  const sort = (req.nextUrl.searchParams.get("sort") ?? "new") as SortOption;
  let tokens = getAllTokens();

  if (sort === "market_cap") {
    tokens = [...tokens].sort((a, b) => b.marketCapUsd - a.marketCapUsd);
  } else if (sort === "volume") {
    tokens = [...tokens].sort((a, b) => b.volume24h - a.volume24h);
  } else {
    tokens = [...tokens].sort((a, b) => b.createdAt - a.createdAt);
  }

  return NextResponse.json({ tokens });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, symbol, description, imageUrl, creator, signature } = body as {
      name: string;
      symbol: string;
      description?: string;
      imageUrl?: string;
      creator: string;
      signature?: string;
    };

    if (!name || !symbol || !creator) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const config = getConfig();
    const feeRecipient = config.fees.feeRecipient;
    const creationFee = config.fees.creationFeeSol;

    if (isPlaceholderAddress(feeRecipient)) {
      return NextResponse.json(
        {
          error:
            "Platform fee wallet not configured. Set FEE_RECIPIENT to your Solana address.",
        },
        { status: 503 },
      );
    }

    if (creationFee > 0) {
      if (!signature) {
        return NextResponse.json(
          {
            error: `Creation fee is ${creationFee} SOL. Pay with Phantom and send the signature.`,
          },
          { status: 400 },
        );
      }

      const verified = await verifySolPayment({
        signature,
        expectedFrom: creator,
        expectedTo: feeRecipient,
        minAmountSol: creationFee,
        memoIncludes: "create:",
      });

      if (!verified.ok) {
        return NextResponse.json({ error: verified.error }, { status: 400 });
      }

      markSignatureUsed(signature, `create:${symbol}`);
    }

    const token = createToken({
      name,
      symbol,
      description: description ?? "",
      imageUrl: imageUrl ?? "",
      creator,
    });

    return NextResponse.json(
      { token, paymentSignature: signature ?? null },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
