import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const instant = false;

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("*").order("sort_order");

  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-soft hover:text-rose">Products</Link>
      <PageHeader title="Add product" />
      {categories && categories.length > 0 ? (
        <ProductForm categories={categories} />
      ) : (
        <p className="text-ink-soft">
          Create a <Link href="/admin/categories" className="text-rose underline">category</Link> first.
        </p>
      )}
    </>
  );
}
