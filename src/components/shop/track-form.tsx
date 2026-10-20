"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { trackOrder, type TrackState } from "@/app/(shop)/track/actions";
import { Badge, Button, Field } from "@/components/ui";
import { formatDate, money } from "@/lib/format";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/types";
import { OrderProgress } from "./order-progress";

export function TrackForm() {
  const params = useSearchParams();
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, {});
  const order = state.order;

  return (
    <div className="grid gap-12 lg:grid-cols-[380px_1fr]">
      <form action={action} className="h-fit space-y-5">
        <Field label="Order number" htmlFor="order">
          <input
            id="order"
            name="order"
            className="field-input uppercase"
            placeholder="MD-XXXXXXXX"
            defaultValue={state.values?.order ?? params.get("order") ?? ""}
            autoComplete="off"
            required
            maxLength={20}
          />
        </Field>
        <Field label="Phone number used for the order" htmlFor="phone">
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            className="field-input"
            placeholder="01012345678"
            defaultValue={state.values?.phone ?? ""}
            autoComplete="tel"
            required
            maxLength={20}
          />
        </Field>
        {state.error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Looking it up…" : "Track order"}
        </Button>
      </form>

      {order && (
        <section aria-live="polite" className="rounded-2xl bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="text-sm text-ink-soft">Order for {order.firstName}</p>
              <h2 className="text-3xl tracking-wide">{order.orderNumber}</h2>
              <p className="mt-1 text-sm text-ink-soft">Placed {formatDate(order.createdAt)}</p>
            </div>
            <div className="text-right">
              <p className="text-xl tabular-nums">{money(order.total)}</p>
              <p className="mt-1 text-sm text-ink-soft">{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
              <div className="mt-1">
                <Badge tone={order.paymentStatus === "paid" ? "sage" : order.paymentStatus === "rejected" ? "danger" : "amber"}>
                  {PAYMENT_STATUS_LABEL[order.paymentStatus]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-8 sm:grid-cols-[1fr_auto]">
            <OrderProgress status={order.status} events={order.events} />
            <ul className="space-y-1 text-sm text-ink-soft sm:text-right">
              {order.items.map((i, n) => (
                <li key={n}>
                  {i.name} × {i.quantity}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
