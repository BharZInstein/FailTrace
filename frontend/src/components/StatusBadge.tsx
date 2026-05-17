import { formatState } from "@/lib/failtrace-api";

export function StatusCodeBadge({ code }: { code: number }) {
  const cls =
    code >= 200 && code < 300
      ? "border-[#00ff94]/30 bg-[#00ff94]/10 text-[#00ff94]"
      : code === 429 || code === 408
        ? "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]"
        : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]";
  return <span className={`border px-2 py-0.5 font-mono text-xs ${cls}`}>{code}</span>;
}

export default function StatusBadge({ state }: { state: string }) {
  const cls =
    state === "delivered" || state === "recovered"
      ? "border-[#00ff94]/30 bg-[#00ff94]/10 text-[#00ff94]"
      : state === "retrying"
        ? "border-[#f59e0b]/40 bg-[#f59e0b]/10 text-[#f59e0b]"
        : "border-[#ef4444]/40 bg-[#ef4444]/10 text-[#ef4444]";
  return <span className={`border px-2 py-0.5 text-xs ${cls}`}>{formatState(state)}</span>;
}
