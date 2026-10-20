"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import { useCart } from "./cart-provider";
import { ButtonLink } from "@/components/ui";
import { money } from "@/lib/format";
import { cartLines, type CartLine } from "@/lib/pricing";
import type { Product } from "@/lib/types";

export function LineDetails({ line }: { line: CartLine }) {
  const details = [
    ...Object.entries(line.options).map(([k, v]) => `${k}: ${v}`),
    ...(line.personalization?.name ? [`Name: ${line.personalization.name}`] : []),
    ...(line.personalization?.title ? [`Title: ${line.personalization.title}`] : []),
    ...(line.personalization?.phone ? [`Phone: ${line.personalization.phone}`] : []),
    ...(line.personalization?.color ? [`Color: ${line.personalization.color}`] : []),
  ];
  return (
    <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
      {details.map((d) => (
        <li key={d}>{d}</li>
      ))}
    </ul>
  );
}

export function CartView({ products }: { products: Product[] }) {
  const cart = useCart();
  const lines = cartLines(cart.items, products);
  const missing = cart.items.length - lines.length;
  const subtotal = lines.reduce((s, l) => s + l.total, 0);

  if (!cart.ready) return <div className="h-64" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="max-w-md py-8">
        <p className="text-lg text-ink-soft">Your cart is empty.</p>
        <ButtonLink href="/shop" className="mt-6">
          Browse the shop
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div>
        {missing > 0 && (
          <p className="mb-4 rounded-xl bg-amber-soft px-4 py-3 text-sm text-amber">
            {missing === 1 ? "One item is" : `${missing} items are`} no longer available and{" "}
            {missing === 1 ? "was" : "were"} left out.
          </p>
        )}
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((line) => (
            <li key={line.key} className="flex gap-4 py-5">
              <Link
                href={`/shop/${line.product.slug}`}
                className="relative h-28 w-24 shrink-0 overflow-hidden rounded-lg bg-card"
              >
                {line.product.images[0] && (
                  <Image src={line.product.images[0]} alt="" fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/shop/${line.product.slug}`} className="font-display text-xl hover:text-rose">
                      {line.product.name}
                    </Link>
                    <LineDetails line={line} />
                  </div>
                  <button
                    type="button"
                    onClick={() => cart.remove(line.key)}
                    className="-mr-2 -mt-1 rounded-full p-2 text-ink-soft hover:bg-petal-soft hover:text-danger"
                    aria-label={`Remove ${line.product.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-full border border-line" role="group" aria-label="Quantity">
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(line.key, line.quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center hover:text-rose"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() => cart.setQuantity(line.key, line.quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center hover:text-rose disabled:opacity-40"
                      disabled={line.quantity >= 99}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="tabular-nums">{money(line.total)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="h-fit rounded-2xl bg-card p-6 shadow-soft lg:sticky lg:top-24">
        <h2 className="text-2xl">Summary</h2>
        <dl className="mt-5 space-y-2">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery</dt>
            <dd className="text-ink-soft">Chosen at checkout</dd>
          </div>
        </dl>
        <ButtonLink href="/checkout" className="mt-6 w-full">
          Go to checkout
        </ButtonLink>
        <Link href="/shop" className="mt-4 block text-center text-sm text-ink-soft hover:text-rose">
          Keep shopping
        </Link>
      </aside>
    </div>
  );
}
