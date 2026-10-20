import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryRow } from "@/components/admin/category-row";

export const instant = false;

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdmin();
  const supabase = await createClient();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("products").select("category_id"),
  ]);
  const counts = new Map<number, number>();
  products?.forEach((p) => counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1));

  return (
    <>
      <PageHeader
        title="Categories"
        description="Categories without products show as “made to order” and link to the custom request form."
      />
      <div className="divide-y divide-line rounded-2xl border border-line bg-card px-5">
        {categories?.map((c) => (
          <CategoryRow key={c.id} category={c} productCount={counts.get(c.id)} />
        ))}
        <CategoryRow />
      </div>
    </>
  );
}
