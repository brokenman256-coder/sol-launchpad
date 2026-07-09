import { NextRequest, NextResponse } from "next/server";
import { getAllTokens, getConfig, updateConfig } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const { password, action, data } = await req.json();
    const config = getConfig();

    if (password !== config.admin.password) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (action === "get_stats") {
      const tokens = getAllTokens();
      const totalVolume = tokens.reduce((s, t) => s + t.volume24h, 0);
      return NextResponse.json({
        stats: {
          totalTokens: tokens.length,
          graduated: tokens.filter((t) => t.complete).length,
          totalVolume,
        },
        config: { ...config, admin: { ...config.admin, password: "***" } },
      });
    }

    if (action === "update_config") {
      const current = getConfig();
      const merged = {
        ...data,
        admin: {
          ...current.admin,
          ...(data.admin ?? {}),
          password: current.admin.password,
        },
      };
      const updated = updateConfig(merged);
      const { admin: _, ...publicConfig } = updated;
      return NextResponse.json({ config: publicConfig });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
