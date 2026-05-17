export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#1a1a1a] ${className}`} />;
}

export function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 7 }).map((_, index) => (
        <SkeletonBlock key={index} className="h-10 w-full rounded" />
      ))}
    </div>
  );
}
