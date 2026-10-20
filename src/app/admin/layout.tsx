import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ExternalLink } from "lucide-react";
import { signOut } from "@/app/(shop)/(auth)/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminNav } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/shop/header-controls";

// Admin pages always show live data, so navigations here may wait on it.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Minnie Design admin" },
  robots: { index: false, follow: false },
};

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const [{ count: newOrders }, { count: proofs }, { count: newRequests }] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "awaiting_review"),
    supabase.from("custom_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-line bg-card px-4 py-4 lg:sticky lg:top-0 lg:h-dvh lg:border-b-0 lg:border-r lg:py-6">
        <div className="mb-4 flex items-center justify-between lg:mb-8 lg:block">
          <Link href="/admin" className="inline-flex items-baseline gap-1.5 px-2">
            <span className="font-display text-2xl italic">minnie</span>
            <span className="text-xs text-rose">admin</span>
          </Link>
          <div className="flex items-center lg:hidden">
            <ThemeToggle />
          </div>
        </div>
        <Suspense fallback={<div className="h-64" />}>
          <AdminNav
            badges={{
              "/admin/orders": (newOrders ?? 0) + (proofs ?? 0),
              "/admin/requests": newRequests ?? 0,
            }}
          />
        </Suspense>
        <div className="mt-8 hidden space-y-1 border-t border-line pt-4 text-sm lg:block">
          <p className="truncate px-3 text-ink-soft" title={admin.email}>
            {admin.email}
          </p>
          <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-petal-soft">
            View shop <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <form action={signOut}>
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-left hover:bg-petal-soft">
              Sign out
            </button>
          </form>
          <div className="px-1">
            <ThemeToggle />
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
