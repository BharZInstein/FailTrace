import type { Metadata } from "next";
import AppNav from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FailTrace",
    template: "%s | FailTrace",
  },
  description: "Webhook reliability control for replay decisions, endpoint health, and delivery visibility.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#0a0a0a] text-white">
        <AppNav />
        <main className="mx-auto max-w-7xl px-5 py-6">{children}</main>
      </body>
    </html>
  );
}
