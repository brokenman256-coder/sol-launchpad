import Link from "next/link";

function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" fill="#86efac" />
      <circle cx="11.5" cy="13.5" r="2.2" fill="#0a0a0a" />
      <circle cx="20.5" cy="13.5" r="2.2" fill="#0a0a0a" />
      <path
        d="M10 20c1.8 2.8 4 4.2 6 4.2S20.2 22.8 22 20"
        stroke="#0a0a0a"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="7" cy="18" r="2.5" fill="#4ade80" opacity="0.85" />
      <circle cx="25" cy="18" r="2.5" fill="#4ade80" opacity="0.85" />
    </svg>
  );
}

export function PumpLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text =
    size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";
  const mark =
    size === "lg" ? "h-9 w-9" : size === "sm" ? "h-5 w-5" : "h-7 w-7";

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 font-bold tracking-tight ${text}`}
    >
      <LogoMark className={mark} />
      <span className="leading-none">
        <span className="text-white">pump</span>
        <span className="text-[#86efac]">.fun</span>
        <span className="ml-1.5 align-middle rounded bg-[#86efac]/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#86efac]">
          beta
        </span>
      </span>
    </Link>
  );
}
