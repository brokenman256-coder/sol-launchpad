"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PumpLogo } from "@/components/layout/PumpLogo";
import type { PlatformConfig } from "@/lib/types";

export function AdminPanel() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [config, setConfig] = useState<Partial<PlatformConfig> | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function login() {
    setError("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "get_stats" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }
    setAuthed(true);
    setStats(data.stats);
    setConfig(data.config);
  }

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, action: "update_config", data: config }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Save failed");
    }
  }

  if (!authed) {
    return (
      <AppShell>
        <div className="mx-auto max-w-sm">
          <div className="mb-6 flex justify-center"><PumpLogo size="lg" /></div>
          <h2 className="mb-2 text-center text-lg font-bold text-white">Admin Panel</h2>
          <p className="mb-4 text-center text-sm text-[#666]">Full platform control</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-4 py-3 text-white outline-none focus:border-[#86efac]"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <button onClick={login} className="pump-btn mt-4 w-full py-3 text-sm">
            Login
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h2 className="mb-6 text-xl font-bold text-white">pump.fun beta Admin</h2>

      {stats && (
        <div className="mb-6 grid grid-cols-3 gap-3">
          {[
            { label: "Total coins", value: stats.totalTokens },
            { label: "Graduated", value: stats.graduated },
            { label: "Volume (SOL)", value: stats.totalVolume?.toFixed(2) },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-4">
              <p className="text-xs text-[#666]">{s.label}</p>
              <p className="text-2xl font-bold text-[#86efac]">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {config && (
        <div className="space-y-4 rounded-xl border border-[#1f1f1f] bg-[#0d0d0d] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs text-[#666]">Brand name</span>
              <input
                value={config.brand?.name ?? "pump.fun beta"}
                onChange={(e) =>
                  setConfig({ ...config, brand: { ...config.brand!, name: e.target.value } })
                }
                className="mt-1 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#666]">Trade fee (bps, 100 = 1%)</span>
              <input
                type="number"
                value={config.fees?.tradeFeeBps ?? 100}
                onChange={(e) =>
                  setConfig({ ...config, fees: { ...config.fees!, tradeFeeBps: parseInt(e.target.value) } })
                }
                className="mt-1 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#666]">Creation fee (SOL)</span>
              <input
                type="number"
                step="0.01"
                value={config.fees?.creationFeeSol ?? 0.02}
                onChange={(e) =>
                  setConfig({ ...config, fees: { ...config.fees!, creationFeeSol: parseFloat(e.target.value) } })
                }
                className="mt-1 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white"
              />
            </label>
            <label className="block">
              <span className="text-xs text-[#666]">Fee wallet</span>
              <input
                value={config.fees?.feeRecipient ?? ""}
                onChange={(e) =>
                  setConfig({ ...config, fees: { ...config.fees!, feeRecipient: e.target.value } })
                }
                className="mt-1 w-full rounded-lg border border-[#1f1f1f] bg-[#0d0d0d] px-3 py-2 text-white"
              />
            </label>
          </div>
          <button onClick={saveConfig} disabled={saving} className="pump-btn px-6 py-2 text-sm disabled:opacity-50">
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      )}
    </AppShell>
  );
}
