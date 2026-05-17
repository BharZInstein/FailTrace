"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getHealth } from "@/lib/failtrace-api";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/analyze", label: "Analyzer" },
  { href: "/endpoints", label: "Endpoints" },
];

export default function AppNav() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await getHealth();
        if (mounted) setOnline(true);
      } catch {
        if (mounted) setOnline(false);
      }
    };
    check();
    const interval = setInterval(check, 8000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1f1f1f] bg-[#0a0a0a]/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-mono text-sm font-semibold tracking-tight text-white">
            <span className="text-[#00ff94]">fail</span>trace
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-1.5 text-sm text-[#d1d5db] transition hover:bg-[#111111] hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-[#6b7280]">
          <span
            className={`h-2 w-2 rounded-full ${online ? "animate-pulse bg-[#00ff94]" : "bg-[#ef4444]"}`}
          />
          {online ? "API LIVE" : "API DOWN"}
        </div>
      </div>
    </header>
  );
}
