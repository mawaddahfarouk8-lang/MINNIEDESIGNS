"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, PHONE_RE, normalizePhone, type ActionState } from "@/lib/validation";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name.").max(100),
  phone: z
    .string()
    .trim()
    .transform(normalizePhone)
    .refine((v) => v === "" || PHONE_RE.test(v), "Enter an Egyptian mobile number, like 01012345678."),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = schema.safeParse({
    full_name: formData.get("full_name"),
    phone: formData.get("phone") ?? "",
  });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  // RLS limits this update to the signed-in user's own row and columns.
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", user.id);
  if (error) return { error: "We couldn't save your details. Try again." };

  revalidatePath("/account");
  return { ok: true };
}
