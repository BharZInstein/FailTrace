import SidebarNav from "@/components/SidebarNav";
import TopBar from "@/components/TopBar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="grid-overlay min-h-screen">
        <div className="mx-auto flex max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
          <SidebarNav />
          <main className="flex-1 space-y-6">
            <TopBar />
            <section className="fade-in rounded-3xl border border-slate-800 bg-slate-950/40 p-6 shadow-xl">
              {children}
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
