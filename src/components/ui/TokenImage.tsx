"use client";

import { useMemo, useState } from "react";
import { coinAvatarUrl } from "@/lib/avatar";

export function TokenImage({
  src,
  symbol,
  name,
  size = 84,
  className = "",
  rounded = "rounded-xl",
}: {
  src?: string;
  symbol: string;
  name?: string;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const fallback = useMemo(
    () => coinAvatarUrl(name || symbol, symbol),
    [name, symbol],
  );
  const [url, setUrl] = useState(src || fallback);
  const [failed, setFailed] = useState(false);

  const display = failed || !url ? fallback : url;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[#141414] ${rounded} ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={display}
        alt={name || symbol}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={() => {
          if (!failed) {
            setFailed(true);
            setUrl(fallback);
          }
        }}
      />
    </div>
  );
}
