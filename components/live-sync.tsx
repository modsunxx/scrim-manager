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
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
      {label}
    </span>
  );
}
