import { NextRequest, NextResponse } from "next/server";
import { addComment } from "@/lib/store";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mint: string }> },
) {
  const { mint } = await params;

  try {
    const { author, text } = await req.json();
    if (!author || !text?.trim()) {
      return NextResponse.json({ error: "Author and text required" }, { status: 400 });
    }

    const comment = addComment(mint, author, text.trim());
    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
