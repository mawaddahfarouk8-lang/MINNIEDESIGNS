import type { CartItem, Product } from "@/lib/types";

// Display-only pricing. The database recalculates every price when the order
// is placed (public.place_order), so this can never change what is charged.
export function unitPrice(product: Product, options: Record<string, string>) {
  return product.options.reduce((sum, option) => {
    const choice = option.choices.find((c) => c.label === options[option.name]);
    return sum + (choice?.price ?? 0);
  }, product.price);
}

export function defaultOptions(product: Product) {
  return Object.fromEntries(
    product.options.map((o) => [o.name, o.choices[0]?.label ?? ""]),
  ) as Record<string, string>;
}

export type CartLine = CartItem & { product: Product; unit: number; total: number };

export function cartLines(items: CartItem[], products: Product[]): CartLine[] {
  return items.flatMap((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return [];
    const unit = unitPrice(product, item.options);
    return [{ ...item, product, unit, total: unit * item.quantity }];
  });
}
