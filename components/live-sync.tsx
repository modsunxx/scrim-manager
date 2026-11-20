"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function LiveSync({
  active = true,
  intervalMs = 2500,
  label = "Live Sync",
}: {
  active?: boolean;
  intervalMs?: number;
  label?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;

    const timer = setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [active, intervalMs, router]);

  if (!active) return null;

  return (
    <span
      className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-[0.18em] uppercase text-rose-400"
      style={{ fontFamily: "var(--font-geist-mono)" }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-70" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-400" />
      </span>
      {label}
    </span>
  );
}
