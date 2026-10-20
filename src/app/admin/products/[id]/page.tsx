import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProduct } from "@/app/admin/products/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductOption } from "@/lib/types";
import { buttonClass } from "@/components/ui";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";

export const instant = false;

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const productId = Number(id);
  if (!Number.isInteger(productId) || productId < 1) notFound();

  const supabase = await createClient();
  const [{ data: row }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
  ]);
  if (!row) notFound();
  const product: Product = { ...row, price: Number(row.price), options: (row.options ?? []) as ProductOption[] };

  return (
    <>
      <Link href="/admin/products" className="text-sm text-ink-soft hover:text-rose">Products</Link>
      <PageHeader
        title={product.name}
        actions={
          <>
            {product.is_active && (
              <a href={`/shop/${product.slug}`} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                View in shop
              </a>
            )}
            <form action={deleteProduct}>
              <input type="hidden" name="id" value={product.id} />
              <ConfirmSubmit message={`Delete ${product.name}? Past orders keep their details. To hide it instead, untick "Show in the shop".`}>
                Delete
              </ConfirmSubmit>
            </form>
          </>
        }
      />
      <ProductForm product={product} categories={categories ?? []} />
    </>
  );
}
