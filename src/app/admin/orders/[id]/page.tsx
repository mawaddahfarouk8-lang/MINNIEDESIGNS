import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, money, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_LABEL,
  orderTone,
  paymentTone,
  type OrderStatus,
  type PaymentStatus,
  type Personalization,
} from "@/lib/types";
import { Badge, buttonClass } from "@/components/ui";
import { Panel } from "@/components/admin/page-header";
import { OrderControls } from "@/components/admin/order-controls";

export const instant = false;

export const metadata: Metadata = { title: "Order" };

function eventLabel(kind: string, to: string | null) {
  if (kind === "created") return "Order placed";
  if (kind === "order_status") return `Status: ${ORDER_STATUS_LABEL[to as OrderStatus] ?? to}`;
  return `Payment: ${PAYMENT_STATUS_LABEL[to as PaymentStatus] ?? to}`;
}

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, order_items(*), order_events(id, kind, to_value, created_at)")
    .eq("id", id)
    .maybeSingle();
  if (!order) notFound();

  let proofUrl: string | null = null;
  if (order.payment_proof_path) {
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(order.payment_proof_path, 600);
    proofUrl = data?.signedUrl ?? null;
  }

  const events = [...order.order_events].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const firstName = order.customer_name.split(" ")[0];

  return (
    <>
      <Link href="/admin/orders" className="text-sm text-ink-soft hover:text-rose">
        Orders
      </Link>
      <div className="mb-8 mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl tracking-wide">{order.order_number}</h1>
          <p className="mt-1 text-ink-soft">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={paymentTone(order.payment_status)}>{PAYMENT_STATUS_LABEL[order.payment_status]}</Badge>
          <Badge tone={orderTone(order.order_status)}>{ORDER_STATUS_LABEL[order.order_status]}</Badge>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="Items">
            <ul className="divide-y divide-line">
              {order.order_items.map((item) => {
                const options = (item.options ?? {}) as Record<string, string>;
                const p = (item.personalization ?? {}) as Personalization;
                return (
                  <li key={item.id} className="flex justify-between gap-4 py-3">
                    <div>
                      <p className="font-medium">
                        {item.product_name} <span className="text-ink-soft">× {item.quantity}</span>
                      </p>
                      <p className="text-sm text-ink-soft">
                        {Object.entries(options).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                      </p>
                      {p.name && (
                        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 rounded-lg bg-petal-soft px-3 py-2 text-sm">
                          <dt className="text-ink-soft">Name</dt><dd>{p.name}</dd>
                          {p.title && (<><dt className="text-ink-soft">Title</dt><dd>{p.title}</dd></>)}
                          {p.phone && (<><dt className="text-ink-soft">Phone</dt><dd>{p.phone}</dd></>)}
                          {p.color && (<><dt className="text-ink-soft">Color</dt><dd>{p.color}</dd></>)}
                        </dl>
                      )}
                    </div>
                    <div className="text-right tabular-nums">
                      <p>{money(item.line_total)}</p>
                      <p className="text-xs text-ink-soft">{money(item.unit_price)} each</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="mt-2 space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tabular-nums">{money(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery ({order.area})</dt><dd className="tabular-nums">{money(order.shipping_fee)}</dd></div>
              <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="tabular-nums">{money(order.total)}</dd></div>
            </dl>
          </Panel>

          <Panel title="Manage">
            <OrderControls
              id={order.id}
              orderStatus={order.order_status}
              paymentStatus={order.payment_status}
              paymentMethod={order.payment_method}
              adminNote={order.admin_note ?? ""}
            />
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Customer">
            <p className="font-medium">{order.customer_name}</p>
            <p className="tabular-nums text-ink-soft">{order.customer_phone}</p>
            {order.customer_email && <p className="text-ink-soft">{order.customer_email}</p>}
            {!order.user_id && <p className="mt-1 text-xs text-ink-soft">Ordered as a guest</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={`tel:${order.customer_phone}`} className={buttonClass("secondary", "sm")}>
                <Phone className="h-4 w-4" /> Call
              </a>
              <a
                href={whatsappLink(order.customer_phone, `Hi ${firstName}, this is Minnie Design about your order ${order.order_number}.`)}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass("secondary", "sm")}
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
              {order.customer_email && (
                <a href={`mailto:${order.customer_email}`} className={buttonClass("secondary", "sm")}>
                  <Mail className="h-4 w-4" /> Email
                </a>
              )}
            </div>
          </Panel>

          <Panel title="Delivery">
            <p>{order.area}, {order.district}</p>
            <p className="text-ink-soft">{order.address}</p>
            {order.notes && (
              <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">{order.notes}</p>
            )}
          </Panel>

          <Panel title="Payment">
            <p>{PAYMENT_METHOD_LABEL[order.payment_method]}</p>
            {proofUrl ? (
              <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block">
                {/* Signed, short-lived URL from a private bucket; shown as-is. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofUrl} alt="Transfer screenshot from the customer" className="max-h-96 w-full rounded-lg border border-line object-contain" />
                <span className="mt-1 block text-xs text-ink-soft">Open full size. The link expires in 10 minutes.</span>
              </a>
            ) : order.payment_method !== "cash_on_delivery" ? (
              <p className="mt-2 text-sm text-danger">No screenshot attached.</p>
            ) : null}
          </Panel>

          <Panel title="History">
            <ol className="space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex justify-between gap-3">
                  <span>{eventLabel(e.kind, e.to_value)}</span>
                  <span className="shrink-0 text-ink-soft">{formatDateTime(e.created_at)}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>
    </>
  );
}
