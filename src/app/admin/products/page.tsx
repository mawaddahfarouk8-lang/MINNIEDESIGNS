import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { Badge, ButtonLink } from "@/components/ui";
import { PageHeader } from "@/components/admin/page-header";

export const instant = false;

export const metadata: Metadata = { title: "Products" };

export default async function AdminProductsPage({ searchParams }: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, price, unit, images, is_active, is_featured, categories(name)")
    .order("sort_order")
    .order("id");

  return (
    <>
      <PageHeader title="Products" actions={<ButtonLink href="/admin/products/new" size="sm">Add product</ButtonLink>} />
      {sp.saved && <p role="status" className="mb-4 rounded-xl bg-sage-soft px-4 py-3 text-sm text-sage">Product saved. The shop shows the change now.</p>}
      {products && products.length > 0 ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {products.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-petal-soft/60">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-paper">
                  {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-ink-soft">{p.categories?.name}</p>
                </div>
                <div className="hidden gap-2 sm:flex">
                  {p.is_featured && <Badge tone="rose">Featured</Badge>}
                  {!p.is_active && <Badge>Hidden</Badge>}
                </div>
                <p className="w-32 text-right text-sm tabular-nums">
                  {money(p.price)} <span className="text-ink-soft">{p.unit}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">No products yet. Add your first one.</p>
      )}
    </>
  );
}
