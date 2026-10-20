import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, money } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  orderTone,
  paymentTone,
} from "@/lib/types";
import { Badge } from "@/components/ui";
import { PageHeader } from "@/components/admin/page-header";

export const instant = false;

export const metadata: Metadata = { title: "Orders" };

const VIEWS = {
  all: { label: "All" },
  new: { label: "To confirm" },
  payments: { label: "Payments to check" },
  active: { label: "In progress" },
  delivered: { label: "Delivered" },
  cancelled: { label: "Cancelled" },
} as const;
type View = keyof typeof VIEWS;

const PAGE_SIZE = 40;

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdmin();
  const sp = await searchParams;
  const view = (typeof sp.view === "string" && sp.view in VIEWS ? sp.view : "all") as View;
  // Keep only characters that can appear in names, numbers and phones, so the
  // value can't alter the PostgREST filter syntax.
  const q = (typeof sp.q === "string" ? sp.q : "").replace(/[^\p{L}\p{N}\s-]/gu, "").trim().slice(0, 60);
  const page = Math.max(1, Number(sp.page) || 1);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, customer_phone, area, total, payment_method, payment_status, order_status, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (view === "new") query = query.eq("order_status", "pending");
  if (view === "payments") query = query.eq("payment_status", "awaiting_review");
  if (view === "active") query = query.in("order_status", ["confirmed", "in_production", "out_for_delivery"]);
  if (view === "delivered") query = query.eq("order_status", "delivered");
  if (view === "cancelled") query = query.eq("order_status", "cancelled");
  if (q) {
    query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
  }

  const { data: orders, count } = await query;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (params: Record<string, string | number>) => {
    const next = new URLSearchParams({ ...(view !== "all" && { view }), ...(q && { q }), ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) });
    return `/admin/orders${next.size ? `?${next}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Orders" description={`${count ?? 0} ${view === "all" ? "in total" : VIEWS[view].label.toLowerCase()}`} />

      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <nav aria-label="Order views" className="flex flex-wrap gap-2">
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <Link
              key={v}
              href={`/admin/orders${v === "all" ? "" : `?view=${v}`}${q ? `${v === "all" ? "?" : "&"}q=${encodeURIComponent(q)}` : ""}`}
              aria-current={v === view ? "page" : undefined}
              className={`rounded-full border px-3.5 py-1.5 text-sm ${
                v === view ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-rose"
              }`}
            >
              {VIEWS[v].label}
            </Link>
          ))}
        </nav>
        <form className="flex gap-2" action="/admin/orders">
          {view !== "all" && <input type="hidden" name="view" value={view} />}
          <label htmlFor="q" className="sr-only">Search orders</label>
          <input id="q" name="q" defaultValue={q} placeholder="Number, name or phone" className="field-input h-10 w-64 py-2" />
          <button type="submit" className="h-10 rounded-full bg-ink px-4 text-sm text-paper">Search</button>
        </form>
      </div>

      {orders && orders.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-line text-left text-ink-soft">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Order</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium">Payment</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-petal-soft/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-medium tracking-wide text-ink hover:text-rose">
                      {o.order_number}
                    </Link>
                    <p className="text-xs text-ink-soft">{formatDateTime(o.created_at)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p>{o.customer_name}</p>
                    <p className="text-xs text-ink-soft tabular-nums">{o.customer_phone} · {o.area}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="mb-1 text-xs text-ink-soft">{PAYMENT_METHOD_LABEL[o.payment_method]}</p>
                    <Badge tone={paymentTone(o.payment_status)}>{PAYMENT_STATUS_LABEL[o.payment_status]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={orderTone(o.order_status)}>{ORDER_STATUS_LABEL[o.order_status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">
          {q ? `No orders match "${q}".` : "No orders here."}
        </p>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="text-rose hover:underline">Newer</Link> : <span />}
          <span className="text-ink-soft">Page {page} of {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="text-rose hover:underline">Older</Link> : <span />}
        </nav>
      )}
    </>
  );
}
