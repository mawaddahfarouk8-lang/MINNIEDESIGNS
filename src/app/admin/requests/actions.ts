"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation";

const schema = z.object({
  id: z.uuid(),
  status: z.enum(["new", "quoted", "accepted", "in_progress", "completed", "declined"]),
  quote_amount: z
    .string()
    .trim()
    .refine((v) => v === "" || (/^\d+(\.\d{1,2})?$/.test(v) && Number(v) <= 1_000_000), "Enter an amount in EGP.")
    .transform((v) => (v === "" ? null : Number(v))),
  admin_note: z.string().trim().max(2000),
});

export async function updateRequest(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id"),
    status: formData.get("status"),
    quote_amount: formData.get("quote_amount") ?? "",
    admin_note: formData.get("admin_note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("custom_requests")
    .update({
      status: parsed.data.status,
      quote_amount: parsed.data.quote_amount,
      admin_note: parsed.data.admin_note || null,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "We couldn't save the changes. Try again." };

  revalidatePath(`/admin/requests/${parsed.data.id}`);
  revalidatePath("/admin", "layout");
  return { ok: true };
}
