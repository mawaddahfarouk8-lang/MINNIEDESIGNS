"use client";

import { useActionState } from "react";
import { updateOrder } from "@/app/admin/orders/actions";
import { Button, FormMessage } from "@/components/ui";
import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, type OrderStatus, type PaymentMethod, type PaymentStatus } from "@/lib/types";
import type { ActionState } from "@/lib/validation";

const NEXT_STEP: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  pending: { to: "confirmed", label: "Confirm order" },
  confirmed: { to: "in_production", label: "Start making it" },
  in_production: { to: "out_for_delivery", label: "Send for delivery" },
  out_for_delivery: { to: "delivered", label: "Mark delivered" },
};

export function OrderControls({
  id,
  orderStatus,
  paymentStatus,
  paymentMethod,
  adminNote,
}: {
  id: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  adminNote: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateOrder, {});
  const next = NEXT_STEP[orderStatus];
  const isTransfer = paymentMethod !== "cash_on_delivery";

  return (
    <div className="space-y-5">
      <FormMessage state={state} />
      {state.ok && <p role="status" className="text-sm text-sage">Saved</p>}

      {(next || (isTransfer && paymentStatus === "awaiting_review")) && (
        <div className="flex flex-wrap gap-2">
          {isTransfer && paymentStatus === "awaiting_review" && (
            <>
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="order_status" value={orderStatus === "pending" ? "confirmed" : orderStatus} />
                <input type="hidden" name="payment_status" value="paid" />
                <Button type="submit" size="sm" disabled={pending}>
                  Transfer received{orderStatus === "pending" ? ", confirm order" : ""}
                </Button>
              </form>
              <form action={action}>
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="order_status" value={orderStatus} />
                <input type="hidden" name="payment_status" value="rejected" />
                <Button type="submit" size="sm" variant="danger" disabled={pending}>
                  Transfer not received
                </Button>
              </form>
            </>
          )}
          {next && !(isTransfer && paymentStatus === "awaiting_review") && (
            <form action={action}>
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="order_status" value={next.to} />
              <input
                type="hidden"
                name="payment_status"
                value={next.to === "delivered" && paymentMethod === "cash_on_delivery" ? "paid" : paymentStatus}
              />
              <Button type="submit" size="sm" disabled={pending}>
                {next.label}
                {next.to === "delivered" && paymentMethod === "cash_on_delivery" ? " and paid" : ""}
              </Button>
            </form>
          )}
        </div>
      )}

      <form action={action} className="space-y-4 border-t border-line pt-5">
        <input type="hidden" name="id" value={id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="order_status" className="text-sm font-medium">Order status</label>
            <select id="order_status" name="order_status" defaultValue={orderStatus} key={orderStatus} className="field-input">
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="payment_status" className="text-sm font-medium">Payment</label>
            <select id="payment_status" name="payment_status" defaultValue={paymentStatus} key={paymentStatus} className="field-input">
              {(Object.keys(PAYMENT_STATUS_LABEL) as PaymentStatus[]).map((s) => (
                <option key={s} value={s}>{PAYMENT_STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="admin_note" className="text-sm font-medium">
            Private note <span className="font-normal text-ink-soft">(only admins see this)</span>
          </label>
          <textarea id="admin_note" name="admin_note" rows={3} maxLength={2000} defaultValue={adminNote} className="field-input" />
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
  );
}
