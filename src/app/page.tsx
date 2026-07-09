import seedTokens from "@/lib/seed-tokens";

export default function Home() {
  const tokens = seedTokens;
  return (
    <main
      style={{
        fontFamily: "system-ui",
        background: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <h1 style={{ color: "#86efac" }}>pump.fun beta</h1>
      <p>{tokens.length} tokens live</p>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
          gap: 12,
          marginTop: 24,
        }}
      >
        {tokens.map((t) => (
          <div
            key={t.mint}
            style={{
              border: "1px solid #1f1f1f",
              borderRadius: 12,
              padding: 12,
              background: "#0d0d0d",
            }}
          >
            <div style={{ fontWeight: 700 }}>
              {t.name}{" "}
              <span style={{ color: "#86efac" }}>({t.symbol})</span>
            </div>
            <div style={{ color: "#666", fontSize: 12, marginTop: 4 }}>
              ${t.marketCapUsd.toLocaleString()} mcap
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
