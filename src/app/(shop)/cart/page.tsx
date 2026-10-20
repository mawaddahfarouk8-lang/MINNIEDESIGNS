import type { Metadata } from "next";
import { getProducts } from "@/lib/catalog";
import { Container } from "@/components/ui";
import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const products = await getProducts();
  return (
    <Container className="pt-12">
      <h1 className="mb-8 text-5xl">Your cart</h1>
      <CartView products={products} />
    </Container>
  );
}
