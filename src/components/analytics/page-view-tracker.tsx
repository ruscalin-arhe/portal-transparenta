"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function PageViewTracker() {
  const pathname = usePathname();
  const last = useRef("");
  useEffect(() => {
    const path = pathname || "/";
    if (path === last.current) return;
    last.current = path;
    fetch("/api/analytics/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);
  return null;
}
