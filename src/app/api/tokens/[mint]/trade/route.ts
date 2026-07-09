import { NextRequest, NextResponse } from "next/server";
import { executeBuy, executeSell, getConfig, getToken } from "@/lib/store";
import { getBuyQuote, getSellQuote } from "@/lib/bonding-curve";
import { creditHolding, debitHolding, getHolding } from "@/lib/holdings";
import {
  markSignatureUsed,
  sendSolFromTreasury,
  verifySolPayment,
} from "@/lib/solana/verify-payment";
import { isPlaceholderAddress } from "@/lib/solana/constants";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;

  try {
    const body = await req.json();
    const { mode, amount, wallet, signature } = body as {
      mode: "buy" | "sell";
      amount: number;
      wallet: string;
      signature?: string;
    };

    if (!wallet || typeof wallet !== "string") {
      return NextResponse.json({ error: "Wallet required" }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const token = getToken(mint);
    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }
    if (token.complete) {
      return NextResponse.json({ error: "Token has graduated" }, { status: 400 });
    }

    const config = getConfig();
    const feeRecipient = config.fees.feeRecipient;

    if (mode === "buy") {
      if (isPlaceholderAddress(feeRecipient)) {
        return NextResponse.json(
          {
            error:
              "Platform fee wallet not configured. Set FEE_RECIPIENT or fees.feeRecipient to a Solana address.",
          },
          { status: 503 },
        );
      }
      if (!signature) {
        return NextResponse.json(
          { error: "Payment signature required. Pay with Phantom first." },
          { status: 400 },
        );
      }

      const verified = await verifySolPayment({
        signature,
        expectedFrom: wallet,
        expectedTo: feeRecipient,
        minAmountSol: amount,
        memoIncludes: `buy:${mint}`,
      });

      if (!verified.ok) {
        return NextResponse.json({ error: verified.error }, { status: 400 });
      }

      const result = executeBuy(mint, amount, wallet, signature);
      if (!result) {
        return NextResponse.json({ error: "Trade failed" }, { status: 400 });
      }

      markSignatureUsed(signature, `buy:${mint}`);
      const balance = creditHolding(wallet, mint, result.tokensOut);

      return NextResponse.json({
        token: result.token,
        tokensOut: result.tokensOut,
        fee: result.fee,
        holding: balance,
        paymentSignature: signature,
      });
    }

    if (mode === "sell") {
      const holding = getHolding(wallet, mint);
      if (holding + 1e-9 < amount) {
        return NextResponse.json(
          {
            error: `Insufficient token balance. You hold ${holding.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${token.symbol}`,
          },
          { status: 400 },
        );
      }

      const quote = getSellQuote(
        amount,
        token.virtualSolReserves,
        token.virtualTokenReserves,
        config.fees.tradeFeeBps,
      );

      if (quote.solOut <= 0) {
        return NextResponse.json({ error: "Sell amount too small" }, { status: 400 });
      }

      const payout = await sendSolFromTreasury({
        to: wallet,
        amountSol: quote.solOut,
        memo: `sell:${mint}`,
      });

      if (!payout.ok) {
        return NextResponse.json({ error: payout.error }, { status: 503 });
      }

      if (!debitHolding(wallet, mint, amount)) {
        return NextResponse.json(
          { error: "Failed to debit holdings after payout" },
          { status: 500 },
        );
      }

      const result = executeSell(mint, amount, wallet, payout.signature);
      if (!result) {
        return NextResponse.json({ error: "Trade failed after payout" }, { status: 500 });
      }

      markSignatureUsed(payout.signature, `sell:${mint}`);

      return NextResponse.json({
        token: result.token,
        solOut: result.solOut,
        fee: result.fee,
        holding: getHolding(wallet, mint),
        paymentSignature: payout.signature,
      });
    }

    return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

/** Quote helper for UI previews */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;
  const mode = req.nextUrl.searchParams.get("mode") ?? "buy";
  const amount = parseFloat(req.nextUrl.searchParams.get("amount") ?? "0");
  const wallet = req.nextUrl.searchParams.get("wallet") ?? "";

  const token = getToken(mint);
  if (!token) {
    return NextResponse.json({ error: "Token not found" }, { status: 404 });
  }

  const config = getConfig();

  if (mode === "sell") {
    const quote = getSellQuote(
      amount,
      token.virtualSolReserves,
      token.virtualTokenReserves,
      config.fees.tradeFeeBps,
    );
    return NextResponse.json({
      ...quote,
      holding: wallet ? getHolding(wallet, mint) : 0,
    });
  }

  const quote = getBuyQuote(
    amount,
    token.virtualSolReserves,
    token.virtualTokenReserves,
    config.fees.tradeFeeBps,
  );
  return NextResponse.json({
    ...quote,
    holding: wallet ? getHolding(wallet, mint) : 0,
  });
}
