"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "./product-card";

export function ShopBrowser({ products, categories }: { products: Product[]; categories: Category[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const active = categories.find((c) => c.slug === params.get("category")) ?? null;

  const list = useMemo(() => {
    const term = query.trim().toLowerCase();
    return products.filter(
      (p) =>
        (!active || p.category_id === active.id) &&
        (!term || `${p.name} ${p.description}`.toLowerCase().includes(term)),
    );
  }, [products, active, query]);

  function selectCategory(slug: string | null) {
    const next = new URLSearchParams(params);
    if (slug) next.set("category", slug);
    else next.delete("category");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-line pb-6 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by category" className="-mx-1 flex flex-wrap gap-2">
          {[{ slug: null, name: "All" }, ...categories].map((c) => {
            const on = (active?.slug ?? null) === c.slug;
            return (
              <button
                key={c.slug ?? "all"}
                type="button"
                aria-pressed={on}
                onClick={() => selectCategory(c.slug)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink hover:border-rose hover:text-rose"
                }`}
              >
                {c.name}
              </button>
            );
          })}
        </div>
        <label className="relative block md:w-72">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            className="field-input rounded-full pl-10"
          />
        </label>
      </div>

      {active?.description && <p className="mt-6 max-w-xl text-ink-soft">{active.description}</p>}

      {list.length > 0 ? (
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.id} product={p} category={categories.find((c) => c.id === p.category_id)} />
          ))}
        </div>
      ) : (
        <div className="mt-12 max-w-md">
          <h2 className="text-3xl">
            {query ? "No products match that search" : `We make ${active?.name.toLowerCase() ?? "these"} to order`}
          </h2>
          <p className="mt-3 text-ink-soft">
            Tell us what you have in mind and we&apos;ll send you a price and a timeline.
          </p>
          <Link
            href={`/custom${active ? `?category=${active.slug}` : ""}`}
            className="mt-6 inline-flex h-11 items-center rounded-full bg-rose px-6 font-medium text-card hover:bg-rose-deep dark:text-paper"
          >
            Request a custom design
          </Link>
        </div>
      )}
    </>
  );
}
