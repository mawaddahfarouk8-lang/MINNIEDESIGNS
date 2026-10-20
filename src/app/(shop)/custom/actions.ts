"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { newRequestReference } from "@/lib/ids";
import { allow, clientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, optionalEmail, phoneSchema, validateImage } from "@/lib/validation";

const schema = z.object({
  category_id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(2, "Enter your name.").max(100),
  phone: phoneSchema,
  email: optionalEmail,
  quantity: z.coerce.number({ message: "Enter a quantity." }).int().min(1, "At least 1.").max(10000),
  content: z.string().trim().min(3, "Tell us what the design should include.").max(2000),
  style: z.string().trim().max(300).optional().default(""),
  needed_by: z
    .string()
    .optional()
    .default("")
    .refine((v) => !v || (/^\d{4}-\d{2}-\d{2}$/.test(v) && v >= new Date().toISOString().slice(0, 10)), {
      message: "Pick today or a later date.",
    }),
  notes: z.string().trim().max(1000).optional().default(""),
});

export type CustomRequestState = {
  ok?: boolean;
  reference?: string;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function submitCustomRequest(
  _prev: CustomRequestState,
  formData: FormData,
): Promise<CustomRequestState> {
  if (formData.get("website")) return { error: "We couldn't send this request. Try again." };

  if (!(await allow("customRequest", await clientIp()))) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  const parsed = schema.safeParse({
    category_id: formData.get("category_id") || undefined,
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email") ?? "",
    quantity: formData.get("quantity"),
    content: formData.get("content"),
    style: formData.get("style") ?? "",
    needed_by: formData.get("needed_by") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  }
  const v = parsed.data;
  const admin = createAdminClient();

  let attachmentPath: string | null = null;
  const file = formData.get("attachment");
  if (file instanceof File && file.size > 0) {
    const check = await validateImage(file);
    if (!check.ok) return { error: check.error, fieldErrors: { attachment: check.error } };
    attachmentPath = `${new Date().toISOString().slice(0, 7)}/${crypto.randomUUID()}.${check.ext}`;
    const { error } = await admin.storage
      .from("request-files")
      .upload(attachmentPath, file, { contentType: check.contentType, upsert: false });
    if (error) {
      console.error("request upload failed", error.message);
      return { error: "We couldn't upload the image. Try again or send it without one." };
    }
  }

  const user = await getSessionUser();
  const reference = newRequestReference();
  const { error } = await admin.from("custom_requests").insert({
    reference,
    user_id: user?.id ?? null,
    category_id: v.category_id ?? null,
    customer_name: v.name,
    customer_phone: v.phone,
    customer_email: v.email || null,
    quantity: v.quantity,
    content: v.content,
    style: v.style || null,
    needed_by: v.needed_by || null,
    attachment_path: attachmentPath,
    notes: v.notes || null,
  });

  if (error) {
    if (attachmentPath) await admin.storage.from("request-files").remove([attachmentPath]);
    console.error("custom request insert failed", error.message);
    return { error: "We couldn't send your request. Try again in a moment." };
  }

  return { ok: true, reference };
}
