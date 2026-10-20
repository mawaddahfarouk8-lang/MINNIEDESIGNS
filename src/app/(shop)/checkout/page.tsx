import type { Metadata } from "next";
import { Suspense } from "react";
import { getSessionUser } from "@/lib/auth";
import { getProducts, getSettings } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { Container } from "@/components/ui";
import { CheckoutForm } from "@/components/cart/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

async function CheckoutWithDefaults() {
  const [products, settings, user] = await Promise.all([getProducts(), getSettings(), getSessionUser()]);

  let defaults = { name: "", phone: "", email: "" };
  if (user) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
    defaults = { name: data?.full_name ?? "", phone: data?.phone ?? "", email: user.email };
  }

  return <CheckoutForm products={products} settings={settings} defaults={defaults} signedIn={Boolean(user)} />;
}

export default function CheckoutPage() {
  return (
    <Container className="pt-12">
      <h1 className="mb-8 text-5xl">Checkout</h1>
      <Suspense fallback={<div className="h-96" aria-busy="true" />}>
        <CheckoutWithDefaults />
      </Suspense>
    </Container>
  );
}
