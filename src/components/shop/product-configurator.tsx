"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui";
import { money } from "@/lib/format";
import { defaultOptions, unitPrice } from "@/lib/pricing";
import { CARD_COLORS, type Personalization, type Product } from "@/lib/types";

export function ProductGallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const images = product.images.length ? product.images : [];
  if (!images.length) return <div className="aspect-[4/5] rounded-2xl bg-petal" />;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-card shadow-soft">
        <Image
          key={images[index]}
          src={images[index]}
          alt={`${product.name}, photo ${index + 1} of ${images.length}`}
          fill
          priority={index === 0}
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-contain p-4"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-3" role="group" aria-label="Product photos">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={i === index}
              className={`relative h-20 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                i === index ? "border-rose" : "border-transparent opacity-75 hover:opacity-100"
              }`}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CardPreview({ p, color }: { p: Personalization; color: (typeof CARD_COLORS)[number] }) {
  return (
    <div
      className="relative mx-auto flex aspect-[7/4] w-full max-w-sm flex-col justify-between rounded-lg p-6 shadow-soft transition-colors"
      style={{ background: color.bg, color: color.fg }}
      aria-label="Business card preview"
    >
      <span className="text-[0.65rem] tracking-[0.3em] opacity-70">minnie design</span>
      <div>
        <p className="font-script text-4xl leading-tight">{p.name || "Your Name"}</p>
        <p className="mt-1 text-sm tracking-wide opacity-80">{p.title || "Your title"}</p>
      </div>
      <p className="text-sm tabular-nums opacity-80">{p.phone || "010 0000 0000"}</p>
    </div>
  );
}

export function ProductConfigurator({ product }: { product: Product }) {
  const cart = useCart();
  const [options, setOptions] = useState(() => defaultOptions(product));
  const [quantity, setQuantity] = useState(1);
  const [colorIndex, setColorIndex] = useState(0);
  const [personal, setPersonal] = useState<Personalization>({});
  const [nameError, setNameError] = useState("");
  const [added, setAdded] = useState(false);

  const unit = unitPrice(product, options);
  const color = CARD_COLORS[colorIndex];

  function addToCart() {
    if (product.is_customizable && (personal.name ?? "").trim().length < 2) {
      setNameError("Add the name to print on the card.");
      document.getElementById("p-name")?.focus();
      return;
    }
    cart.add({
      productId: product.id,
      quantity,
      options,
      personalization: product.is_customizable
        ? {
            name: personal.name?.trim(),
            title: personal.title?.trim() || undefined,
            phone: personal.phone?.trim() || undefined,
            color: color.name,
          }
        : undefined,
    });
    setAdded(true);
  }

  return (
    <div className="space-y-8">
      {product.options.map((option) => (
        <fieldset key={option.name}>
          <legend className="mb-3 text-sm font-medium">{option.name}</legend>
          <div className="flex flex-wrap gap-2">
            {option.choices.map((choice) => {
              const id = `${option.name}-${choice.label}`.replace(/\s+/g, "-");
              const checked = options[option.name] === choice.label;
              return (
                <label
                  key={choice.label}
                  htmlFor={id}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rose ${
                    checked
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-card hover:border-rose"
                  }`}
                >
                  <input
                    id={id}
                    type="radio"
                    name={option.name}
                    value={choice.label}
                    checked={checked}
                    onChange={() => {
                      setOptions((o) => ({ ...o, [option.name]: choice.label }));
                      setAdded(false);
                    }}
                    className="sr-only"
                  />
                  {choice.label}
                  {choice.price > 0 && <span className="opacity-70"> +{money(choice.price)}</span>}
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}

      {product.is_customizable && (
        <section aria-labelledby="personalize-heading" className="space-y-5 rounded-2xl border border-line bg-card p-5">
          <h2 id="personalize-heading" className="text-2xl">
            Your card
          </h2>
          <CardPreview p={personal} color={color} />
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Card color</legend>
            <div className="flex gap-3">
              {CARD_COLORS.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColorIndex(i)}
                  aria-pressed={i === colorIndex}
                  aria-label={c.name}
                  title={c.name}
                  className={`h-9 w-9 rounded-full border border-ink/15 ring-offset-2 ring-offset-card transition ${
                    i === colorIndex ? "ring-2 ring-ink" : ""
                  }`}
                  style={{ background: c.bg }}
                />
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="p-name" className="block text-sm font-medium">
                Name on the card
              </label>
              <input
                id="p-name"
                className="field-input"
                maxLength={40}
                value={personal.name ?? ""}
                aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "p-name-error" : undefined}
                onChange={(e) => {
                  setPersonal((p) => ({ ...p, name: e.target.value }));
                  setNameError("");
                  setAdded(false);
                }}
              />
              {nameError && (
                <p id="p-name-error" className="text-sm text-danger">
                  {nameError}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-title" className="block text-sm font-medium">
                Title <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="p-title"
                className="field-input"
                maxLength={40}
                value={personal.title ?? ""}
                onChange={(e) => setPersonal((p) => ({ ...p, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="p-phone" className="block text-sm font-medium">
                Phone on the card <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="p-phone"
                className="field-input"
                inputMode="tel"
                maxLength={20}
                value={personal.phone ?? ""}
                onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-wrap items-center gap-4 border-t border-line pt-6">
        <div className="flex items-center rounded-full border border-line bg-card" role="group" aria-label="Quantity">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:text-rose disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <output className="w-8 text-center tabular-nums" aria-live="polite">
            {quantity}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(99, q + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:text-rose"
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-2xl tabular-nums">
          {money(unit * quantity)}
          <span className="ml-2 text-sm text-ink-soft">
            {quantity > 1 ? `${money(unit)} each` : product.unit}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={addToCart} className="min-w-44">
          Add to cart
        </Button>
        <p role="status" className="flex items-center gap-2 text-sm">
          {added && (
            <>
              <Check className="h-4 w-4 text-sage" />
              Added.{" "}
              <Link href="/cart" className="text-rose underline underline-offset-4">
                View cart
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
