"use client";

import { useEffect, useState } from "react";
import { PumpLogo } from "../layout/PumpLogo";

export function WelcomeModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const seen =
      localStorage.getItem("pump_fun_welcome") ||
      localStorage.getItem("pump_fuun_welcome");
    if (!seen) setOpen(true);
  }, []);

  function dismiss() {
    localStorage.setItem("pump_fun_welcome", "1");
    localStorage.removeItem("pump_fuun_welcome");
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="welcome-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
      <div className="welcome-panel w-full max-w-md overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] shadow-2xl shadow-black/60">
        <div className="relative flex h-48 items-end justify-center overflow-hidden bg-gradient-to-b from-[#14532d] via-[#166534] to-[#0d0d0d]">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute -left-6 top-8 h-24 w-24 rounded-full bg-[#86efac]/40 blur-2xl" />
            <div className="absolute right-0 top-4 h-32 w-32 rounded-full bg-[#4ade80]/30 blur-3xl" />
          </div>
          <div className="relative mb-2 flex flex-col items-center">
            <svg viewBox="0 0 80 80" className="anim-float h-24 w-24 drop-shadow-lg" aria-hidden>
              <circle cx="40" cy="40" r="36" fill="#86efac" />
              <circle cx="28" cy="34" r="5" fill="#0a0a0a" />
              <circle cx="52" cy="34" r="5" fill="#0a0a0a" />
              <path
                d="M26 48c4 7 9 10.5 14 10.5S50 55 54 48"
                stroke="#0a0a0a"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="16" cy="46" r="7" fill="#4ade80" />
              <circle cx="64" cy="46" r="7" fill="#4ade80" />
            </svg>
          </div>
        </div>
        <div className="px-6 pb-6 pt-2 text-center">
          <div className="mb-3 flex justify-center">
            <PumpLogo size="lg" />
          </div>
          <p className="text-[15px] font-semibold text-white">Welcome to pump.fun beta</p>
          <p className="mt-2 text-sm leading-relaxed text-[#999]">
            Pump lets anyone create coins, giving everyone equal access to buy
            and sell from the start. Prices can move quickly, so trade carefully.
          </p>
          <button onClick={dismiss} className="pump-btn mt-5 w-full py-3 text-sm">
            I&apos;m ready to pump
          </button>
          <p className="mt-4 text-[10px] leading-relaxed text-[#555]">
            By clicking this button, you agree to the Terms and Conditions,
            Privacy Policy, and certify that you are over 18 years old.
          </p>
        </div>
      </div>
    </div>
  );
}
