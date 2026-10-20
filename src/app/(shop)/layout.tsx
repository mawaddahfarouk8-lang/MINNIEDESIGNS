import { CartProvider } from "@/components/cart/cart-provider";
import { SiteFooter } from "@/components/shop/site-footer";
import { SiteHeader } from "@/components/shop/site-header";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </CartProvider>
  );
}
