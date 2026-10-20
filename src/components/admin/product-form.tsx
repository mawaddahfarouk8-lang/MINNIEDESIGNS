"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { saveProduct, uploadProductImage } from "@/app/admin/products/actions";
import { Button, Field, FormMessage } from "@/components/ui";
import { resizeImage } from "@/lib/resize-image";
import type { Category, Product, ProductOption } from "@/lib/types";
import type { ActionState } from "@/lib/validation";

type Draft = {
  id?: number;
  name: string;
  slug: string;
  category_id: number;
  description: string;
  price: string;
  unit: string;
  is_customizable: boolean;
  is_featured: boolean;
  is_active: boolean;
  sort_order: string;
  options: ProductOption[];
  images: string[];
};

export function ProductForm({ product, categories }: { product?: Product; categories: Category[] }) {
  const [draft, setDraft] = useState<Draft>(() => ({
    id: product?.id,
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    category_id: product?.category_id ?? categories[0]?.id ?? 0,
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    unit: product?.unit ?? "per design",
    is_customizable: product?.is_customizable ?? false,
    is_featured: product?.is_featured ?? false,
    is_active: product?.is_active ?? true,
    sort_order: String(product?.sort_order ?? 0),
    options: product?.options ?? [],
    images: product?.images ?? [],
  }));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    fd.set(
      "product",
      JSON.stringify({
        ...draft,
        price: Number(draft.price),
        sort_order: Number(draft.sort_order) || 0,
      }),
    );
    return saveProduct(prev, fd);
  }, {});
  const e = state.fieldErrors ?? {};

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setOption = (i: number, next: ProductOption) =>
    set("options", draft.options.map((o, n) => (n === i ? next : o)));

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError("");
    const added: string[] = [];
    for (const file of Array.from(files).slice(0, 8 - draft.images.length)) {
      const fd = new FormData();
      fd.set("file", await resizeImage(file, 2000, 0.86));
      const res = await uploadProductImage(fd);
      if (res.url) added.push(res.url);
      else setUploadError(res.error ?? "Upload failed.");
    }
    setDraft((d) => ({ ...d, images: [...d.images, ...added] }));
    setUploading(false);
  }

  function moveImage(i: number, dir: -1 | 1) {
    const next = [...draft.images];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set("images", next);
  }

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]" noValidate>
      <div className="space-y-6">
        <FormMessage state={state} />
        <section className="space-y-5 rounded-2xl border border-line bg-card p-5">
          <Field label="Name" htmlFor="name" error={e.name}>
            <input id="name" className="field-input" value={draft.name} maxLength={120} onChange={(ev) => set("name", ev.target.value)} required />
          </Field>
          <Field label="Web address" htmlFor="slug" error={e.slug} hint={`/shop/${draft.slug || "made-from-the-name"}`}>
            <input id="slug" className="field-input" value={draft.slug} maxLength={80} placeholder="Leave empty to make it from the name" onChange={(ev) => set("slug", ev.target.value)} />
          </Field>
          <Field label="Description" htmlFor="description" error={e.description}>
            <textarea id="description" rows={4} maxLength={2000} className="field-input" value={draft.description} onChange={(ev) => set("description", ev.target.value)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Starting price (EGP)" htmlFor="price" error={e.price}>
              <input id="price" inputMode="decimal" className="field-input" value={draft.price} onChange={(ev) => set("price", ev.target.value)} />
            </Field>
            <Field label="Sold" htmlFor="unit" hint="For example: per pack">
              <input id="unit" className="field-input" maxLength={40} value={draft.unit} onChange={(ev) => set("unit", ev.target.value)} />
            </Field>
            <Field label="Category" htmlFor="category_id" error={e.category_id}>
              <select id="category_id" className="field-input" value={draft.category_id} onChange={(ev) => set("category_id", Number(ev.target.value))}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
          <div>
            <h2 className="font-sans text-base font-semibold">Photos</h2>
            <p className="text-sm text-ink-soft">The first photo is the main one. Up to 8.</p>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {draft.images.map((src, i) => (
              <li key={src} className="group relative aspect-square overflow-hidden rounded-lg border border-line bg-paper">
                <Image src={src} alt={`Photo ${i + 1}`} fill sizes="160px" className="object-cover" />
                {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-xs text-paper">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink/70 p-1 text-paper">
                  <button type="button" aria-label="Move earlier" onClick={() => moveImage(i, -1)} disabled={i === 0} className="rounded p-1 hover:bg-white/20 disabled:opacity-30"><ArrowLeft className="h-4 w-4" /></button>
                  <button type="button" aria-label="Remove photo" onClick={() => set("images", draft.images.filter((_, n) => n !== i))} className="rounded p-1 hover:bg-white/20"><Trash2 className="h-4 w-4" /></button>
                  <button type="button" aria-label="Move later" onClick={() => moveImage(i, 1)} disabled={i === draft.images.length - 1} className="rounded p-1 hover:bg-white/20 disabled:opacity-30"><ArrowRight className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
            {draft.images.length < 8 && (
              <li>
                <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-line text-sm text-ink-soft hover:border-rose hover:text-rose has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-rose">
                  <ImagePlus className="h-6 w-6" />
                  {uploading ? "Uploading…" : "Add photos"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={uploading} onChange={(ev) => addImages(ev.target.files)} />
                </label>
              </li>
            )}
          </ul>
          {uploadError && <p className="text-sm text-danger">{uploadError}</p>}
        </section>

        <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
          <div>
            <h2 className="font-sans text-base font-semibold">Options</h2>
            <p className="text-sm text-ink-soft">Choices customers pick, like paper or size. The extra price is added to the starting price.</p>
          </div>
          {draft.options.map((opt, i) => (
            <fieldset key={i} className="space-y-3 rounded-xl border border-line p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-1.5">
                  <label htmlFor={`opt-${i}`} className="text-sm font-medium">Option name</label>
                  <input id={`opt-${i}`} className="field-input" maxLength={40} value={opt.name} placeholder="Paper" onChange={(ev) => setOption(i, { ...opt, name: ev.target.value })} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => set("options", draft.options.filter((_, n) => n !== i))}>
                  Remove option
                </Button>
              </div>
              <legend className="sr-only">Option {i + 1}</legend>
              <ul className="space-y-2">
                {opt.choices.map((c, j) => (
                  <li key={j} className="flex items-center gap-2">
                    <input aria-label="Choice" className="field-input flex-1" maxLength={40} value={c.label} placeholder="Matte" onChange={(ev) => setOption(i, { ...opt, choices: opt.choices.map((x, m) => (m === j ? { ...x, label: ev.target.value } : x)) })} />
                    <span className="text-sm text-ink-soft">+</span>
                    <input aria-label="Extra price in EGP" inputMode="decimal" className="field-input w-24" value={c.price} onChange={(ev) => setOption(i, { ...opt, choices: opt.choices.map((x, m) => (m === j ? { ...x, price: Number(ev.target.value) || 0 } : x)) })} />
                    <span className="text-sm text-ink-soft">EGP</span>
                    <button type="button" aria-label="Remove choice" className="rounded-full p-2 text-ink-soft hover:text-danger" onClick={() => setOption(i, { ...opt, choices: opt.choices.filter((_, m) => m !== j) })}>
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <Button type="button" variant="ghost" size="sm" onClick={() => setOption(i, { ...opt, choices: [...opt.choices, { label: "", price: 0 }] })}>
                <Plus className="h-4 w-4" /> Add choice
              </Button>
            </fieldset>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => set("options", [...draft.options, { name: "", choices: [{ label: "", price: 0 }] }])}>
            <Plus className="h-4 w-4" /> Add option
          </Button>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-line bg-card p-5 xl:sticky xl:top-6">
        {[
          { key: "is_active", label: "Show in the shop", hint: "Hidden products can't be ordered." },
          { key: "is_featured", label: "Feature on the home page" },
          { key: "is_customizable", label: "Business card personalization", hint: "Adds the name, title, phone and color fields with a live preview." },
        ].map((t) => (
          <label key={t.key} className="flex cursor-pointer gap-3">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[var(--rose)]" checked={draft[t.key as "is_active"]} onChange={(ev) => set(t.key as "is_active", ev.target.checked)} />
            <span>
              <span className="block text-sm font-medium">{t.label}</span>
              {t.hint && <span className="block text-xs text-ink-soft">{t.hint}</span>}
            </span>
          </label>
        ))}
        <Field label="Order in lists" htmlFor="sort_order" hint="Lower numbers show first.">
          <input id="sort_order" inputMode="numeric" className="field-input" value={draft.sort_order} onChange={(ev) => set("sort_order", ev.target.value)} />
        </Field>
        <Button type="submit" className="w-full" disabled={pending || uploading}>
          {pending ? "Saving…" : product ? "Save product" : "Create product"}
        </Button>
      </aside>
    </form>
  );
}
