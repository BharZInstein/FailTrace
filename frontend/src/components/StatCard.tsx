export default function StatCard({
  label,
  value,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  trend: string;
  tone?: "safe" | "warn" | "danger" | "neutral";
}) {
  const toneClass =
    tone === "safe"
      ? "text-[#00ff94]"
      : tone === "warn"
        ? "text-[#f59e0b]"
        : tone === "danger"
          ? "text-[#ef4444]"
          : "text-white";

  return (
    <div className="border border-[#1f1f1f] bg-[linear-gradient(180deg,#141414,#111111)] p-4">
      <div className="text-xs uppercase tracking-wide text-[#6b7280]">{label}</div>
      <div className={`mt-3 font-mono text-3xl font-semibold ${toneClass}`}>{value}</div>
      <div className="mt-2 font-mono text-xs text-[#6b7280]">{trend}</div>
    </div>
  );
}
