import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts } from "@/lib/catalog";
import { Container } from "@/components/ui";
import { ShopBrowser } from "@/components/shop/shop-browser";

export const metadata: Metadata = {
  title: "Shop",
  description: "Business cards, magazines, notebooks and coloring books from Minnie Design.",
};

export default async function ShopPage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);

  return (
    <Container className="pb-8 pt-12">
      <h1 className="mb-8 text-5xl sm:text-6xl">Shop</h1>
      <Suspense fallback={<div className="h-96" />}>
        <ShopBrowser products={products} categories={categories} />
      </Suspense>
    </Container>
  );
}
