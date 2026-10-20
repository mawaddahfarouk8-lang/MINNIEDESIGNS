"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Copy, ImagePlus } from "lucide-react";
import { placeOrder, type PlaceOrderResult } from "@/app/(shop)/checkout/actions";
import { useCart } from "./cart-provider";
import { LineDetails } from "./cart-view";
import { Button, ButtonLink, Field } from "@/components/ui";
import { money } from "@/lib/format";
import { cartLines } from "@/lib/pricing";
import { resizeImage } from "@/lib/resize-image";
import {
  PAYMENT_METHOD_LABEL,
  withoutPreview,
  type PaymentMethod,
  type Product,
  type StoreSettings,
} from "@/lib/types";

type Defaults = { name: string; phone: string; email: string };

export function CheckoutForm({
  products,
  settings,
  defaults,
  signedIn,
}: {
  products: Product[];
  settings: StoreSettings;
  defaults: Defaults;
  signedIn: boolean;
}) {
  const cart = useCart();
  const lines = cartLines(cart.items, products);
  const [area, setArea] = useState(settings.shipping_zones[0]?.name ?? "");
  const [payment, setPayment] = useState<PaymentMethod>("cash_on_delivery");
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PlaceOrderResult | null>(null);
  const [pending, startTransition] = useTransition();

  const methods = useMemo(() => {
    const list: { id: PaymentMethod; detail: string }[] = [
      { id: "cash_on_delivery", detail: "Pay the courier when your order arrives." },
    ];
    if (settings.instapay_handle) {
      list.push({ id: "instapay", detail: `Send the total to ${settings.instapay_handle}` });
    }
    if (settings.vodafone_cash_number) {
      list.push({ id: "vodafone_cash", detail: `Send the total to ${settings.vodafone_cash_number}` });
    }
    return list;
  }, [settings]);

  const fee = settings.shipping_zones.find((z) => z.name === area)?.fee ?? 0;
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const errors = result && !result.ok ? (result.fieldErrors ?? {}) : {};

  if (result?.ok) {
    return <OrderPlaced orderNumber={result.orderNumber} total={result.total} phone={result.phone} payment={payment} signedIn={signedIn} />;
  }

  if (!cart.ready) return <div className="h-96" aria-busy="true" />;

  if (lines.length === 0) {
    return (
      <div className="max-w-md">
        <p className="text-lg text-ink-soft">Your cart is empty, so there&apos;s nothing to check out yet.</p>
        <ButtonLink href="/shop" className="mt-6">Browse the shop</ButtonLink>
      </div>
    );
  }

  if (!settings.accepting_orders) {
    return (
      <p className="max-w-lg rounded-xl bg-amber-soft px-5 py-4 text-amber">
        We&apos;re not taking new online orders right now. Message us on Instagram and we&apos;ll help you order.
      </p>
    );
  }

  async function onProofChange(file: File | undefined) {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    if (!file) {
      setProof(null);
      setProofPreview(null);
      return;
    }
    const resized = await resizeImage(file);
    setProof(resized);
    setProofPreview(URL.createObjectURL(resized));
  }

  function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    const fd = new FormData();
    fd.set("website", String(data.get("website") ?? ""));
    fd.set(
      "order",
      JSON.stringify({
        name: data.get("name"),
        phone: data.get("phone"),
        email: data.get("email"),
        area,
        district: data.get("district"),
        address: data.get("address"),
        notes: data.get("notes"),
        payment_method: payment,
        items: lines.map((l) => ({
          product_id: l.productId,
          quantity: l.quantity,
          options: l.options,
          ...(l.personalization ? { personalization: withoutPreview(l.personalization) } : {}),
        })),
      }),
    );
    if (payment !== "cash_on_delivery" && proof) fd.set("proof", proof);

    startTransition(async () => {
      const res = await placeOrder(fd);
      setResult(res);
      if (res.ok) {
        cart.clear();
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        requestAnimationFrame(() => document.querySelector<HTMLElement>("[aria-invalid='true'], [role='alert']")?.focus());
      }
    });
  }

  const inputProps = (name: string) => ({
    id: name,
    name,
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
    className: "field-input",
  });

  return (
    <form
      className="grid gap-10 lg:grid-cols-[1fr_380px]"
      onSubmit={(e) => {
        e.preventDefault();
        submit(e.currentTarget);
      }}
      noValidate
    >
      <div className="space-y-10">
        {result && !result.ok && (
          <p role="alert" tabIndex={-1} className="rounded-xl bg-danger-soft px-4 py-3 text-danger">
            {result.error}
          </p>
        )}

        <section className="space-y-5" aria-labelledby="contact-heading">
          <h2 id="contact-heading" className="text-2xl">Your details</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" error={errors.name}>
              <input {...inputProps("name")} autoComplete="name" defaultValue={defaults.name} required />
            </Field>
            <Field label="Mobile number" htmlFor="phone" error={errors.phone} hint="We call this number to confirm your order.">
              <input {...inputProps("phone")} type="tel" inputMode="tel" autoComplete="tel" placeholder="01012345678" defaultValue={defaults.phone} required />
            </Field>
          </div>
          <Field label="Email" htmlFor="email" optional error={errors.email}>
            <input {...inputProps("email")} type="email" autoComplete="email" defaultValue={defaults.email} />
          </Field>
          <div aria-hidden className="absolute -left-[9999px]">
            <label htmlFor="website">Website</label>
            <input id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>
        </section>

        <section className="space-y-5" aria-labelledby="delivery-heading">
          <h2 id="delivery-heading" className="text-2xl">Delivery</h2>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Area</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {settings.shipping_zones.map((z) => (
                <label
                  key={z.name}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rose ${
                    area === z.name ? "border-ink bg-card" : "border-line hover:border-rose"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input type="radio" name="area" value={z.name} checked={area === z.name} onChange={() => setArea(z.name)} className="accent-[var(--rose)]" />
                    {z.name}
                  </span>
                  <span className="text-sm text-ink-soft">{money(z.fee)}</span>
                </label>
              ))}
            </div>
            {errors.area && <p className="mt-2 text-sm text-danger">{errors.area}</p>}
          </fieldset>
          <Field label="District or neighborhood" htmlFor="district" error={errors.district}>
            <input {...inputProps("district")} autoComplete="address-level3" required />
          </Field>
          <Field label="Street address" htmlFor="address" error={errors.address} hint="Building, floor and apartment help the courier find you.">
            <textarea {...inputProps("address")} rows={2} autoComplete="street-address" required />
          </Field>
          <Field label="Notes for us" htmlFor="notes" optional error={errors.notes}>
            <textarea {...inputProps("notes")} rows={2} maxLength={1000} />
          </Field>
        </section>

        <section className="space-y-5" aria-labelledby="payment-heading">
          <h2 id="payment-heading" className="text-2xl">Payment</h2>
          <fieldset>
            <legend className="sr-only">Payment method</legend>
            <div className="space-y-3">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rose ${
                    payment === m.id ? "border-ink bg-card" : "border-line hover:border-rose"
                  }`}
                >
                  <input type="radio" name="payment" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} className="mt-1.5 accent-[var(--rose)]" />
                  <span>
                    <span className="block font-medium">{PAYMENT_METHOD_LABEL[m.id]}</span>
                    <span className="block text-sm text-ink-soft">{m.detail}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {payment !== "cash_on_delivery" && (
            <div className="space-y-3 rounded-xl border border-dashed border-line bg-card p-4">
              <p className="text-sm">
                Send <strong className="tabular-nums">{money(subtotal + fee)}</strong>, then upload a screenshot of the
                transfer. We confirm your order once we see the payment.
              </p>
              <label
                htmlFor="proof"
                className="flex cursor-pointer items-center gap-4 rounded-lg border border-line bg-paper p-3 hover:border-rose has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rose"
              >
                {proofPreview ? (
                  <Image src={proofPreview} alt="Your transfer screenshot" width={56} height={80} unoptimized className="h-20 w-14 rounded object-cover" />
                ) : (
                  <span className="flex h-20 w-14 items-center justify-center rounded bg-petal-soft text-rose">
                    <ImagePlus className="h-6 w-6" />
                  </span>
                )}
                <span className="text-sm">
                  <span className="block font-medium">{proof ? "Change screenshot" : "Upload transfer screenshot"}</span>
                  <span className="text-ink-soft">JPG, PNG or WEBP</span>
                </span>
                <input
                  id="proof"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  aria-invalid={Boolean(errors.proof) || undefined}
                  onChange={(e) => onProofChange(e.target.files?.[0])}
                />
              </label>
              {errors.proof && <p className="text-sm text-danger">{errors.proof}</p>}
            </div>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-5 rounded-2xl bg-card p-6 shadow-soft lg:sticky lg:top-24">
        <h2 className="text-2xl">Your order</h2>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.key} className="flex justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {l.product.name} <span className="text-ink-soft">× {l.quantity}</span>
                </p>
                <LineDetails line={l} />
              </div>
              <p className="shrink-0 tabular-nums">{money(l.total)}</p>
            </li>
          ))}
        </ul>
        <dl className="space-y-2 border-t border-line pt-4">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Subtotal</dt>
            <dd className="tabular-nums">{money(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery to {area || "your area"}</dt>
            <dd className="tabular-nums">{money(fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(subtotal + fee)}</dd>
          </div>
        </dl>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Placing order…" : "Place order"}
        </Button>
        <Link href="/cart" className="block text-center text-sm text-ink-soft hover:text-rose">
          Edit cart
        </Link>
      </aside>
    </form>
  );
}

function OrderPlaced({
  orderNumber,
  total,
  phone,
  payment,
  signedIn,
}: {
  orderNumber: string;
  total: number;
  phone: string;
  payment: PaymentMethod;
  signedIn: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="max-w-xl" role="status">
      <CheckCircle2 className="h-12 w-12 text-sage" strokeWidth={1.5} />
      <h2 className="mt-4 text-4xl">Thank you, your order is in</h2>
      <p className="mt-3 text-ink-soft">
        {payment === "cash_on_delivery"
          ? `We'll call ${phone} to confirm it. You'll pay ${money(total)} when it arrives.`
          : `We'll check your transfer of ${money(total)} and call ${phone} to confirm.`}
      </p>
      <div className="mt-8 rounded-2xl bg-card p-6 shadow-soft">
        <p className="text-sm text-ink-soft">Your order number</p>
        <div className="mt-1 flex items-center gap-3">
          <p className="font-display text-3xl tracking-wide">{orderNumber}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(orderNumber).then(() => setCopied(true))}
            className="rounded-full p-2 text-ink-soft hover:bg-petal-soft hover:text-rose"
            aria-label="Copy order number"
          >
            <Copy className="h-4 w-4" />
          </button>
          {copied && <span className="text-sm text-sage">Copied</span>}
        </div>
        <p className="mt-3 text-sm text-ink-soft">Keep it to track your order with your phone number.</p>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href={signedIn ? "/account" : `/track?order=${orderNumber}`}>
          {signedIn ? "See my orders" : "Track this order"}
        </ButtonLink>
        <ButtonLink href="/shop" variant="secondary">Keep shopping</ButtonLink>
      </div>
    </div>
  );
}
