import Link from "next/link";

const navItems = [
  { href: "/overview", label: "Overview" },
  { href: "/events", label: "Event Explorer" },
  { href: "/retry-timeline", label: "Retry Timeline" },
  { href: "/endpoints", label: "Endpoint Health" },
  { href: "/fingerprints", label: "Failure Fingerprints" },
  { href: "/replay-intelligence", label: "Replay Intelligence" },
  { href: "/rl-optimization", label: "Adaptive Retry Optimizer" },
];

export default function SidebarNav() {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:gap-6 lg:px-6 lg:py-8">
      <div className="rounded-2xl glow-panel p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Adaptive Webhook
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-50">
          Reliability & Replay Intel
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          Operational intelligence for webhook reliability, replay safety, and
          adaptive retry control.
        </p>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-700 hover:bg-slate-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">FastAPI Ready</p>
        <p className="mt-2">Endpoints wired via Axios in src/lib/api.ts.</p>
      </div>
    </aside>
  );
}
