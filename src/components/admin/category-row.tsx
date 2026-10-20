"use client";

import { useActionState } from "react";
import { deleteCategory, saveCategory } from "@/app/admin/categories/actions";
import { Button } from "@/components/ui";
import type { Category } from "@/lib/types";
import type { ActionState } from "@/lib/validation";

export function CategoryRow({ category, productCount }: { category?: Category; productCount?: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCategory, {});
  const [delState, delAction, deleting] = useActionState<ActionState, FormData>(deleteCategory, {});
  const key = category?.id ?? "new";
  const error = state.error ?? delState.error;

  return (
    <div className="space-y-2 py-4">
      <form action={action} className="grid items-end gap-3 md:grid-cols-[1.2fr_2fr_90px_auto_auto]">
        {category && <input type="hidden" name="id" value={category.id} />}
        <div className="space-y-1">
          <label htmlFor={`name-${key}`} className="text-xs text-ink-soft">Name</label>
          <input id={`name-${key}`} name="name" defaultValue={category?.name} required maxLength={80} className="field-input" placeholder="New category" />
        </div>
        <div className="space-y-1">
          <label htmlFor={`desc-${key}`} className="text-xs text-ink-soft">Short description</label>
          <input id={`desc-${key}`} name="description" defaultValue={category?.description} maxLength={300} className="field-input" />
        </div>
        <div className="space-y-1">
          <label htmlFor={`sort-${key}`} className="text-xs text-ink-soft">Order</label>
          <input id={`sort-${key}`} name="sort_order" inputMode="numeric" defaultValue={category?.sort_order ?? 0} className="field-input" />
        </div>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={category?.is_active ?? true} className="h-4 w-4 accent-[var(--rose)]" />
          Visible
        </label>
        <Button type="submit" size="sm" variant={category ? "secondary" : "primary"} disabled={pending} className="h-11">
          {pending ? "Saving…" : category ? "Save" : "Add category"}
        </Button>
      </form>
      <div className="flex items-center gap-4 text-sm">
        {category && (
          <span className="text-ink-soft">
            {productCount ?? 0} {productCount === 1 ? "product" : "products"} · /shop?category={category.slug}
          </span>
        )}
        {state.ok && <span role="status" className="text-sage">Saved</span>}
        {error && <span role="alert" className="text-danger">{error}</span>}
        {category && !productCount && (
          <form action={delAction} className="ml-auto">
            <input type="hidden" name="id" value={category.id} />
            <button type="submit" disabled={deleting} className="text-danger hover:underline">Delete</button>
          </form>
        )}
      </div>
    </div>
  );
}
