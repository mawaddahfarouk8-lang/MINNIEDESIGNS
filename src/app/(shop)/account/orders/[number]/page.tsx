import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/types";
import { Badge, Container } from "@/components/ui";
import { OrderProgress } from "@/components/shop/order-progress";

export const metadata: Metadata = { title: "Order details", robots: { index: false } };

async function OrderDetail({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  await requireUser(`/account/orders/${number}`);
  const supabase = await createClient();

  // RLS returns the order only if it belongs to the signed-in user.
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), order_events(kind, to_value, created_at)")
    .eq("order_number", number)
    .maybeSingle();
  if (!order) notFound();

  const events = order.order_events
    .filter((e) => e.kind !== "payment_status")
    .map((e) => ({ kind: e.kind, to: e.to_value, at: e.created_at }));

  return (
    <>
      <Link href="/account" className="text-sm text-ink-soft hover:text-rose">
        My account
      </Link>
      <h1 className="mt-2 text-4xl tracking-wide sm:text-5xl">{order.order_number}</h1>
      <p className="mt-2 text-ink-soft">Placed {formatDate(order.created_at)}</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl bg-card p-6 shadow-soft">
          <h2 className="mb-6 text-2xl">Progress</h2>
          <OrderProgress status={order.order_status} events={events} />
        </section>
        <aside className="space-y-6">
          <section>
            <h2 className="text-2xl">Items</h2>
            <ul className="mt-3 divide-y divide-line">
              {order.order_items.map((i) => (
                <li key={i.id} className="flex justify-between gap-4 py-3">
                  <div>
                    <p>
                      {i.product_name} <span className="text-ink-soft">× {i.quantity}</span>
                    </p>
                    <p className="text-sm text-ink-soft">
                      {Object.entries((i.options ?? {}) as Record<string, string>)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")}
                    </p>
                  </div>
                  <span className="tabular-nums">{money(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd>{money(order.shipping_fee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd>{money(order.total)}</dd></div>
            </dl>
          </section>
          <section className="space-y-1 text-sm">
            <h2 className="mb-2 text-2xl">Payment and delivery</h2>
            <p>{PAYMENT_METHOD_LABEL[order.payment_method]} <Badge tone={order.payment_status === "paid" ? "sage" : "amber"}>{PAYMENT_STATUS_LABEL[order.payment_status]}</Badge></p>
            <p className="text-ink-soft">{order.area}, {order.district}</p>
            <p className="text-ink-soft">{order.address}</p>
          </section>
        </aside>
      </div>
    </>
  );
}

export default function OrderPage({ params }: PageProps<"/account/orders/[number]">) {
  return (
    <Container className="pt-10">
      <Suspense fallback={<div className="h-96" aria-busy="true" />}>
        <OrderDetail params={params} />
      </Suspense>
    </Container>
  );
}
