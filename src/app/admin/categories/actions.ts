"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/lib/validation";

const schema = z.object({
  id: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "Enter a name.").max(80),
  description: z.string().trim().max(300),
  sort_order: z.coerce.number().int().min(0).max(10000),
  is_active: z.boolean(),
});

function slugify(v: string) {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = schema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    sort_order: formData.get("sort_order") || 0,
    is_active: formData.get("is_active") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("categories").update(values).eq("id", id)
    : await supabase.from("categories").insert({ ...values, slug: slugify(values.name) || `category-${Date.now()}` });
  if (error) {
    return { error: error.code === "23505" ? "A category with this name already exists." : "We couldn't save the category." };
  }

  updateTag("catalog");
  revalidatePath("/admin/categories");
  return { ok: true };
}

export async function deleteCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id < 1) return { error: "Invalid category." };
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    return {
      error:
        error.code === "23503"
          ? "Move or delete the products in this category first, or hide the category instead."
          : "We couldn't delete the category.",
    };
  }
  updateTag("catalog");
  revalidatePath("/admin/categories");
  return { ok: true };
}
