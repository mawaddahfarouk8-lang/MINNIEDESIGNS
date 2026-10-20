"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { PHONE_RE, normalizePhone, type ActionState } from "@/lib/validation";

const optionalPhone = z
  .string()
  .trim()
  .transform(normalizePhone)
  .refine((v) => v === "" || PHONE_RE.test(v), "Use an Egyptian mobile number, like 01012345678.");

const schema = z.object({
  shipping_zones: z
    .array(z.object({ name: z.string().trim().min(1, "Name every delivery area.").max(60), fee: z.number().min(0).max(10000) }))
    .min(1, "Add at least one delivery area.")
    .max(20)
    .refine((z) => new Set(z.map((x) => x.name)).size === z.length, "Delivery area names must be different."),
  instapay_handle: z.string().trim().max(120),
  vodafone_cash_number: optionalPhone,
  whatsapp_number: optionalPhone,
  instagram_url: z
    .string()
    .trim()
    .max(300)
    .refine((v) => v === "" || /^https:\/\/(www\.)?instagram\.com\/[\w.]+\/?$/.test(v), "Use a link like https://www.instagram.com/yourname"),
  accepting_orders: z.boolean(),
});

export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("settings") ?? ""));
  } catch {
    return { error: "We couldn't read the form. Refresh and try again." };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.from("store_settings").update(parsed.data).eq("id", true);
  if (error) return { error: "We couldn't save the settings. Try again." };

  updateTag("settings");
  return { ok: true };
}

const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export async function addAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) return { error: "We couldn't look up that account." };
  const user = data.users.find((u) => u.email?.toLowerCase() === parsed.data);
  if (!user) return { error: "No account uses that email. Ask them to create an account first, then add them here." };

  const { error: insertError } = await admin.from("admins").upsert({ user_id: user.id });
  if (insertError) return { error: "We couldn't add that admin." };

  revalidatePath("/admin/settings");
  return { ok: true };
}

export async function removeAdmin(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const userId = String(formData.get("user_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return { error: "Invalid admin." };
  if (userId === me.id) return { error: "You can't remove yourself. Ask another admin to do it." };

  const admin = createAdminClient();
  const { error } = await admin.from("admins").delete().eq("user_id", userId);
  if (error) return { error: "We couldn't remove that admin." };

  revalidatePath("/admin/settings");
  return { ok: true };
}
