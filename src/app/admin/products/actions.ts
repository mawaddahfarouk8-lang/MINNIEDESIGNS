"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { SUPABASE_URL } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, validateImage, type ActionState } from "@/lib/validation";

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/product-images/`;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const optionSchema = z.object({
  name: z.string().trim().min(1, "Name every option group.").max(40),
  choices: z
    .array(
      z.object({
        label: z.string().trim().min(1, "Name every choice.").max(40),
        price: z.number().min(0).max(100000),
      }),
    )
    .min(1, "Each option group needs at least one choice.")
    .max(12),
});

const productSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Enter a name.").max(120),
  slug: z.string().trim().max(80),
  category_id: z.number().int().positive({ message: "Choose a category." }),
  description: z.string().trim().max(2000),
  price: z.number({ message: "Enter a price." }).min(0).max(1_000_000),
  unit: z.string().trim().max(40),
  is_customizable: z.boolean(),
  is_featured: z.boolean(),
  is_active: z.boolean(),
  sort_order: z.number().int().min(0).max(10000),
  options: z
    .array(optionSchema)
    .max(6)
    .refine((o) => new Set(o.map((x) => x.name)).size === o.length, "Option group names must be different."),
  // Only bundled images or files from this project's product-images bucket.
  images: z
    .array(
      z.string().refine((u) => /^\/images\/[\w.-]+$/.test(u) || u.startsWith(PUBLIC_PREFIX), "Invalid image."),
    )
    .max(8),
});

export async function saveProduct(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("product") ?? ""));
  } catch {
    return { error: "We couldn't read the form. Refresh and try again." };
  }
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fieldErrors: fieldErrors(parsed.error) };
  }

  const { id, ...values } = parsed.data;
  const slug = slugify(values.slug || values.name);
  if (!slug) return { fieldErrors: { slug: "Use letters or numbers in the web address." } };

  const supabase = await createClient();
  const row = { ...values, slug, unit: values.unit || "per design" };
  const { error } = id
    ? await supabase.from("products").update(row).eq("id", id)
    : await supabase.from("products").insert(row);

  if (error) {
    if (error.code === "23505") return { fieldErrors: { slug: "Another product already uses this web address." } };
    console.error("save product failed", error.message);
    return { error: "We couldn't save the product. Try again." };
  }

  updateTag("catalog");
  redirect("/admin/products?saved=1");
}

export async function deleteProduct(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return;
  const supabase = await createClient();
  // Past orders keep their own copy of the name and price (order_items),
  // so deleting a product never changes order history.
  await supabase.from("products").delete().eq("id", id);
  updateTag("catalog");
  redirect("/admin/products");
}

export async function uploadProductImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  await requireAdmin();
  const file = formData.get("file");
  const check = await validateImage(file instanceof File ? file : null);
  if (!check.ok) return { error: check.error };

  const supabase = await createClient();
  const path = `${crypto.randomUUID()}.${check.ext}`;
  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file as File, { contentType: check.contentType, cacheControl: "31536000", upsert: false });
  if (error) {
    console.error("product image upload failed", error.message);
    return { error: "We couldn't upload that image. Try again." };
  }
  return { url: `${PUBLIC_PREFIX}${path}` };
}
