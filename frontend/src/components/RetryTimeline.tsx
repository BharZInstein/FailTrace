"use client";

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number(value));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }
  return hours * 60 + minutes;
}

export default function RetryTimeline({
  events,
}: {
  events: { time: string; status: string; latencyMs?: number }[];
}) {
  return (
    <div className="space-y-4">
      {events.map((event, index) => {
        const tone =
          event.status === "200"
            ? "bg-emerald-500/20 text-emerald-200"
            : event.status === "timeout"
            ? "bg-amber-500/20 text-amber-200"
            : "bg-rose-500/20 text-rose-200";
        const current = toMinutes(event.time);
        const previous = index > 0 ? toMinutes(events[index - 1].time) : null;
        const intervalMinutes =
          current !== null && previous !== null ? current - previous : null;
        return (
          <div
            key={`${event.time}-${index}`}
            className="flex items-center gap-4"
            title={`Status ${event.status}`}
          >
            <div className="h-3 w-3 rounded-full bg-blue-400" />
            <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-100">{event.time}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs ${tone}`}>
                  {event.status}
                </span>
              </div>
              {event.latencyMs ? (
                <p className="mt-1 text-xs text-slate-400">
                  Latency {event.latencyMs} ms
                </p>
              ) : null}
              {intervalMinutes !== null ? (
                <p className="mt-1 text-xs text-slate-500">
                  Interval since last: {intervalMinutes} min
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
