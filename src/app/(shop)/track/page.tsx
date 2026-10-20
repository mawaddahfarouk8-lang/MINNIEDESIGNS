import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui";
import { TrackForm } from "@/components/shop/track-form";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Check the status of your Minnie Design order.",
};

export default function TrackPage() {
  return (
    <Container className="pt-12">
      <h1 className="text-5xl">Track an order</h1>
      <p className="mb-10 mt-3 max-w-lg text-ink-soft">
        Enter the order number from your confirmation and the phone number you ordered with.
      </p>
      <Suspense fallback={<div className="h-72" />}>
        <TrackForm />
      </Suspense>
    </Container>
  );
}
