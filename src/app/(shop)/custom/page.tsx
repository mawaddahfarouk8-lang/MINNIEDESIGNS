import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories } from "@/lib/catalog";
import { Container } from "@/components/ui";
import { CustomRequestForm } from "@/components/shop/custom-request-form";

export const metadata: Metadata = {
  title: "Request a custom design",
  description: "Tell Minnie Design what you need and get a price and a timeline.",
};

export default async function CustomPage() {
  const categories = await getCategories();
  return (
    <Container className="pt-12">
      <h1 className="text-5xl">Request a custom design</h1>
      <p className="mb-10 mt-3 max-w-lg text-ink-soft">
        Describe what you need. We&apos;ll reply with a price and a timeline before any work starts.
      </p>
      <Suspense fallback={<div className="h-96" />}>
        <CustomRequestForm categories={categories} />
      </Suspense>
    </Container>
  );
}
