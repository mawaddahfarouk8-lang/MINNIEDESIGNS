"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation";

const schema = z.object({
  id: z.uuid(),
  order_status: z.enum(["pending", "confirmed", "in_production", "out_for_delivery", "delivered", "cancelled"]),
  payment_status: z.enum(["pending", "awaiting_review", "paid", "rejected", "refunded"]),
  admin_note: z.string().trim().max(2000).optional(),
});

export async function updateOrder(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    order_status: formData.get("order_status"),
    payment_status: formData.get("payment_status"),
    admin_note: formData.get("admin_note") ?? undefined,
  });
  if (!parsed.success) return { error: "Choose a valid status." };

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("orders")
    .select("payment_method, payment_proof_path")
    .eq("id", parsed.data.id)
    .single();
  if (!current) return { error: "This order no longer exists." };

  if (
    parsed.data.payment_status === "paid" &&
    current.payment_method !== "cash_on_delivery" &&
    !current.payment_proof_path
  ) {
    return { error: "There's no transfer screenshot on this order. Check the payment before marking it paid." };
  }

  // RLS allows this update only for admins, and column grants limit it to
  // statuses and the note.
  const { error } = await supabase
    .from("orders")
    .update({
      order_status: parsed.data.order_status,
      payment_status: parsed.data.payment_status,
      ...(parsed.data.admin_note !== undefined && { admin_note: parsed.data.admin_note || null }),
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "We couldn't save the changes. Try again." };

  revalidatePath(`/admin/orders/${parsed.data.id}`);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
