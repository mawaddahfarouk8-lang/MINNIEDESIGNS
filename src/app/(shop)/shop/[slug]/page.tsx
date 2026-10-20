import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getCategories, getProductBySlug, getProducts } from "@/lib/catalog";
import { Container } from "@/components/ui";
import { ProductConfigurator, ProductGallery } from "@/components/shop/product-configurator";

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/shop/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: { images: product.images.slice(0, 1) },
  };
}

async function ProductContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, categories] = await Promise.all([getProductBySlug(slug), getCategories()]);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.category_id);

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-8 text-sm text-ink-soft">
        <Link href="/shop" className="hover:text-rose">
          Shop
        </Link>
        {category && (
          <>
            <span aria-hidden> / </span>
            <Link href={`/shop?category=${category.slug}`} className="hover:text-rose">
              {category.name}
            </Link>
          </>
        )}
      </nav>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery product={product} />
        <div>
          <h1 className="text-4xl sm:text-5xl">{product.name}</h1>
          <p className="mt-4 max-w-prose text-lg text-ink-soft">{product.description}</p>
          <div className="mt-8">
            <ProductConfigurator product={product} />
          </div>
          <p className="mt-10 text-sm text-ink-soft">
            Want different sizes or content?{" "}
            <Link href={`/custom${category ? `?category=${category.slug}` : ""}`} className="text-rose underline underline-offset-4">
              Request a custom design
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

export default function ProductPage({ params }: PageProps<"/shop/[slug]">) {
  return (
    <Container className="pt-8">
      <Suspense fallback={<div className="h-[70vh]" aria-busy="true" />}>
        <ProductContent params={params} />
      </Suspense>
    </Container>
  );
}
