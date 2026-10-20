import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Product, ProductOption, ShippingZone, StoreSettings } from "@/lib/types";

// Public catalog reads, cached and tagged. Admin edits call
// updateTag("catalog") / updateTag("settings") to refresh them.

function toProduct(row: Record<string, unknown>): Product {
  return {
    ...(row as Omit<Product, "price" | "options">),
    price: Number(row.price),
    options: (row.options ?? []) as ProductOption[],
  };
}

export async function getCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const { data, error } = await createPublicClient()
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data;
}

export async function getProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const { data, error } = await createPublicClient()
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("sort_order")
    .order("id");
  if (error) throw new Error(error.message);
  return data.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug) ?? null;
}

export async function getSettings(): Promise<StoreSettings> {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");

  const { data, error } = await createPublicClient()
    .from("store_settings")
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return {
    ...data,
    shipping_zones: (data.shipping_zones ?? []) as ShippingZone[],
  };
}
