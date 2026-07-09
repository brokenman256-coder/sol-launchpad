"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export function CommentForm({ mint, onPosted }: { mint: string; onPosted: () => void }) {
  const { publicKey } = useWallet();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !text.trim()) return;

    setLoading(true);
    await fetch(`/api/tokens/${mint}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author: publicKey.toBase58(), text }),
    });
    setText("");
    setLoading(false);
    onPosted();
  }

  return (
    <form onSubmit={submit} className="mt-4 flex gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={publicKey ? "Add a reply..." : "Connect wallet to reply"}
        disabled={!publicKey || loading}
        className="flex-1 rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-sm text-white outline-none focus:border-[#86efac] disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!publicKey || !text.trim() || loading}
        className="rounded-lg bg-[#86efac] px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
      >
        Post
      </button>
    </form>
  );
}
