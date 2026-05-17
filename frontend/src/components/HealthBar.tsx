export default function HealthBar({ value }: { value: number }) {
  const color = value >= 75 ? "#00ff94" : value >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="flex min-w-[130px] items-center gap-2">
      <div className="h-1.5 flex-1 bg-[#242424]">
        <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
      </div>
      <span className="w-8 text-right font-mono text-xs text-white">{value}</span>
    </div>
  );
}
