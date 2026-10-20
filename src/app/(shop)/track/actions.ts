"use server";

import { z } from "zod";
import { allow, clientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";
import { normalizePhone } from "@/lib/validation";

export type TrackedOrder = {
  orderNumber: string;
  firstName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  total: number;
  createdAt: string;
  items: { name: string; quantity: number }[];
  events: { kind: string; to: string | null; at: string }[];
};

export type TrackState = { error?: string; order?: TrackedOrder; values?: { order: string; phone: string } };

const schema = z.object({
  order: z.string().trim().toUpperCase().regex(/^MD-[A-Z0-9]{6,12}$/),
  phone: z.string().trim().transform(normalizePhone),
});

const NOT_FOUND = "We couldn't find an order with that number and phone. Check both and try again.";

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const values = {
    order: String(formData.get("order") ?? "").slice(0, 40),
    phone: String(formData.get("phone") ?? "").slice(0, 25),
  };

  if (!(await allow("trackOrder", await clientIp()))) {
    return { error: RATE_LIMIT_MESSAGE, values };
  }

  const parsed = schema.safeParse(values);
  if (!parsed.success) return { error: NOT_FOUND, values };

  // Service role, but scoped to the one order matching BOTH number and phone,
  // and only non-sensitive fields are returned (no address or email).
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, customer_name, order_status, payment_status, payment_method, total, created_at")
    .eq("order_number", parsed.data.order)
    .eq("customer_phone", parsed.data.phone)
    .maybeSingle();

  if (!order) return { error: NOT_FOUND, values };

  const [{ data: items }, { data: events }] = await Promise.all([
    admin.from("order_items").select("product_name, quantity").eq("order_id", order.id).order("id"),
    admin
      .from("order_events")
      .select("kind, to_value, created_at")
      .eq("order_id", order.id)
      .in("kind", ["created", "order_status"])
      .order("created_at"),
  ]);

  return {
    values,
    order: {
      orderNumber: order.order_number,
      firstName: order.customer_name.split(" ")[0],
      status: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      total: Number(order.total),
      createdAt: order.created_at,
      items: (items ?? []).map((i) => ({ name: i.product_name, quantity: i.quantity })),
      events: (events ?? []).map((e) => ({ kind: e.kind, to: e.to_value, at: e.created_at })),
    },
  };
}
