"use server";

import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { newOrderNumber } from "@/lib/ids";
import { allow, clientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { fieldErrors, optionalEmail, phoneSchema, validateImage } from "@/lib/validation";

const itemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(99),
  options: z.record(z.string().max(60), z.string().max(60)),
  personalization: z
    .object({
      name: z.string().max(60).optional(),
      title: z.string().max(60).optional(),
      phone: z.string().max(60).optional(),
      color: z.string().max(60).optional(),
    })
    .strict()
    .optional(),
});

const orderSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  phone: phoneSchema,
  email: optionalEmail,
  area: z.string().trim().min(1, "Choose a delivery area.").max(60),
  district: z.string().trim().min(2, "Enter your district or neighborhood.").max(100),
  address: z.string().trim().min(3, "Enter your street address.").max(300),
  notes: z.string().trim().max(1000).optional().default(""),
  payment_method: z.enum(["cash_on_delivery", "instapay", "vodafone_cash"], {
    message: "Choose how you'll pay.",
  }),
  items: z.array(itemSchema).min(1, "Your cart is empty.").max(30),
});

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number; phone: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const DB_ERRORS: Record<string, string> = {
  ORDERS_CLOSED: "We're not taking new orders right now. Message us on Instagram to order.",
  INVALID_AREA: "We only deliver to the areas listed. Choose one of them.",
  PROOF_REQUIRED: "Upload the screenshot of your transfer.",
  PRODUCT_UNAVAILABLE: "One of the products in your cart is no longer available. Remove it and try again.",
  INVALID_OPTION: "One of the product options changed. Remove the item and add it again.",
  INVALID_QUANTITY: "Quantities must be between 1 and 99.",
  INVALID_PERSONALIZATION: "Check the details for your business card.",
  INVALID_ITEMS: "Your cart is empty or has too many items.",
};

export async function placeOrder(formData: FormData): Promise<PlaceOrderResult> {
  // Honeypot field: real visitors never see or fill it.
  if (formData.get("website")) {
    return { ok: false, error: "We couldn't place this order. Try again." };
  }

  const ip = await clientIp();
  if (!(await allow("placeOrder", ip))) {
    return { ok: false, error: RATE_LIMIT_MESSAGE };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("order") ?? ""));
  } catch {
    return { ok: false, error: "We couldn't read the order. Refresh the page and try again." };
  }

  const parsed = orderSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrors(parsed.error),
    };
  }
  const order = parsed.data;
  const admin = createAdminClient();

  let proofPath: string | null = null;
  if (order.payment_method !== "cash_on_delivery") {
    const file = formData.get("proof");
    const check = await validateImage(file instanceof File ? file : null);
    if (!check.ok) {
      return { ok: false, error: check.error, fieldErrors: { proof: check.error } };
    }
    const month = new Date().toISOString().slice(0, 7);
    proofPath = `${month}/${crypto.randomUUID()}.${check.ext}`;
    const { error } = await admin.storage
      .from("payment-proofs")
      .upload(proofPath, file as File, { contentType: check.contentType, upsert: false });
    if (error) {
      console.error("proof upload failed", error.message);
      return { ok: false, error: "We couldn't upload the screenshot. Try again." };
    }
  }

  const user = await getSessionUser();
  const orderNumber = newOrderNumber();

  const { data, error } = await admin.rpc("place_order", {
    p_order: order,
    p_user_id: user?.id ?? null,
    p_order_number: orderNumber,
    p_proof_path: proofPath,
  } as never);

  if (error || !data?.[0]) {
    if (proofPath) await admin.storage.from("payment-proofs").remove([proofPath]);
    const code = error?.message ?? "";
    if (!DB_ERRORS[code]) console.error("place_order failed", code);
    return {
      ok: false,
      error: DB_ERRORS[code] ?? "We couldn't place your order. Try again in a moment.",
    };
  }

  return {
    ok: true,
    orderNumber: data[0].order_number,
    total: Number(data[0].total),
    phone: order.phone,
  };
}
