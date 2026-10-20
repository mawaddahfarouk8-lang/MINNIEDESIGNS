import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, money } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, orderTone, paymentTone } from "@/lib/types";
import { Badge } from "@/components/ui";
import { PageHeader, Panel } from "@/components/admin/page-header";

export const instant = false;

export default async function AdminOverview() {
  await requireAdmin();
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [toConfirm, toCheck, inProgress, requests, monthOrders, recent] = await Promise.all([
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("order_status", "pending"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "awaiting_review"),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("order_status", ["confirmed", "in_production", "out_for_delivery"]),
    supabase.from("custom_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("orders").select("total, order_status").gte("created_at", monthStart).neq("order_status", "cancelled"),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, total, order_status, payment_status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const monthRevenue = (monthOrders.data ?? []).reduce((s, o) => s + Number(o.total), 0);

  const attention = [
    { label: "Payments to check", count: toCheck.count ?? 0, href: "/admin/orders?view=payments" },
    { label: "Orders to confirm", count: toConfirm.count ?? 0, href: "/admin/orders?view=new" },
    { label: "New custom requests", count: requests.count ?? 0, href: "/admin/requests?status=new" },
  ];

  return (
    <>
      <PageHeader title="Overview" />

      <div className="grid gap-4 md:grid-cols-3">
        {attention.map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className={`rounded-2xl border p-5 transition-colors hover:border-rose ${
              a.count > 0 ? "border-rose/40 bg-petal-soft" : "border-line bg-card"
            }`}
          >
            <p className="text-sm text-ink-soft">{a.label}</p>
            <p className={`mt-1 font-display text-4xl tabular-nums ${a.count > 0 ? "text-rose-deep" : ""}`}>{a.count}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Panel>
          <p className="text-sm text-ink-soft">Orders this month</p>
          <p className="mt-1 text-2xl tabular-nums">{monthOrders.data?.length ?? 0}</p>
        </Panel>
        <Panel>
          <p className="text-sm text-ink-soft">Sales this month</p>
          <p className="mt-1 text-2xl tabular-nums">{money(monthRevenue)}</p>
          <p className="text-xs text-ink-soft">All orders except cancelled</p>
        </Panel>
        <Panel>
          <p className="text-sm text-ink-soft">In progress</p>
          <p className="mt-1 text-2xl tabular-nums">{inProgress.count ?? 0}</p>
        </Panel>
      </div>

      <Panel
        title="Latest orders"
        className="mt-8"
        actions={
          <Link href="/admin/orders" className="text-sm text-rose hover:underline">
            All orders
          </Link>
        }
      >
        {recent.data && recent.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {recent.data.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 hover:text-rose">
                  <span className="w-32 whitespace-nowrap font-medium tracking-wide">{o.order_number}</span>
                  <span className="min-w-32 flex-1">{o.customer_name}</span>
                  <span className="text-sm text-ink-soft">{formatDateTime(o.created_at)}</span>
                  <Badge tone={paymentTone(o.payment_status)}>{PAYMENT_STATUS_LABEL[o.payment_status]}</Badge>
                  <Badge tone={orderTone(o.order_status)}>{ORDER_STATUS_LABEL[o.order_status]}</Badge>
                  <span className="w-24 text-right tabular-nums">{money(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-soft">No orders yet. They&apos;ll appear here as soon as customers check out.</p>
        )}
      </Panel>
    </>
  );
}
