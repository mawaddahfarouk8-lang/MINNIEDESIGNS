"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { submitCustomRequest, type CustomRequestState } from "@/app/(shop)/custom/actions";
import { Button, ButtonLink, Field } from "@/components/ui";
import { resizeImage } from "@/lib/resize-image";
import type { Category } from "@/lib/types";

export function CustomRequestForm({ categories }: { categories: Category[] }) {
  const params = useSearchParams();
  const preset = categories.find((c) => c.slug === params.get("category"));
  const [fileName, setFileName] = useState("");
  // The server action is passed directly so the form also works without JavaScript.
  const [state, action, pending] = useActionState<CustomRequestState, FormData>(submitCustomRequest, {});
  const errors = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  if (state.ok) {
    return (
      <div className="max-w-xl" role="status">
        <CheckCircle2 className="h-12 w-12 text-sage" strokeWidth={1.5} />
        <h2 className="mt-4 text-4xl">Request sent</h2>
        <p className="mt-3 text-ink-soft">
          Your reference is <strong className="text-ink">{state.reference}</strong>. We&apos;ll contact you with a
          price and a timeline, usually within a day.
        </p>
        <ButtonLink href="/shop" variant="secondary" className="mt-8">
          Back to the shop
        </ButtonLink>
      </div>
    );
  }

  const invalid = (name: string) => ({
    "aria-invalid": Boolean(errors[name]) || undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form action={action} className="max-w-2xl space-y-6" noValidate>
      {state.error && (
        <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-danger">
          {state.error}
        </p>
      )}
      <Field label="What do you need?" htmlFor="category_id" optional>
        <select id="category_id" name="category_id" className="field-input" defaultValue={preset?.id ?? ""}>
          <option value="">Something else</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Your name" htmlFor="name" error={errors.name}>
          <input id="name" name="name" className="field-input" autoComplete="name" required {...invalid("name")} />
        </Field>
        <Field label="Mobile number" htmlFor="phone" error={errors.phone}>
          <input id="phone" name="phone" type="tel" inputMode="tel" className="field-input" placeholder="01012345678" autoComplete="tel" required {...invalid("phone")} />
        </Field>
        <Field label="Email" htmlFor="email" optional error={errors.email}>
          <input id="email" name="email" type="email" className="field-input" autoComplete="email" {...invalid("email")} />
        </Field>
        <Field label="Quantity" htmlFor="quantity" error={errors.quantity}>
          <input id="quantity" name="quantity" type="number" min={1} max={10000} defaultValue={1} className="field-input" required {...invalid("quantity")} />
        </Field>
      </div>
      <Field label="What should the design include?" htmlFor="content" error={errors.content} hint="Names, titles, phone numbers, dates, slogans.">
        <textarea id="content" name="content" rows={4} maxLength={2000} className="field-input" required {...invalid("content")} />
      </Field>
      <Field label="Colors and style" htmlFor="style" optional hint="For example: soft pink and gold, minimal.">
        <input id="style" name="style" maxLength={300} className="field-input" />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Needed by" htmlFor="needed_by" optional error={errors.needed_by}>
          <input id="needed_by" name="needed_by" type="date" min={today} className="field-input" {...invalid("needed_by")} />
        </Field>
        <Field label="Logo or reference image" htmlFor="attachment" optional error={errors.attachment} hint={fileName || "JPG, PNG or WEBP"}>
          <input
            id="attachment"
            name="attachment"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="field-input file:mr-3 file:rounded-full file:border-0 file:bg-petal file:px-3 file:py-1 file:text-sm file:text-ink"
            onChange={async (e) => {
              const input = e.currentTarget;
              const f = input.files?.[0];
              setFileName(f?.name ?? "");
              if (!f) return;
              // Swap in the resized image so large phone photos fit the upload limit.
              const resized = await resizeImage(f);
              if (resized !== f) {
                const dt = new DataTransfer();
                dt.items.add(resized);
                input.files = dt.files;
              }
            }}
          />
        </Field>
      </div>
      <Field label="Anything else?" htmlFor="notes" optional>
        <textarea id="notes" name="notes" rows={3} maxLength={1000} className="field-input" />
      </Field>
      <div aria-hidden className="absolute -left-[9999px]">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </Button>
    </form>
  );
}
