"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { addAdmin, removeAdmin, saveSettings } from "@/app/admin/settings/actions";
import { Button, Field, FormMessage } from "@/components/ui";
import type { ShippingZone, StoreSettings } from "@/lib/types";
import type { ActionState } from "@/lib/validation";

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [zones, setZones] = useState<ShippingZone[]>(settings.shipping_zones);
  const [state, action, pending] = useActionState<ActionState, FormData>(async (prev, fd) => {
    fd.set(
      "settings",
      JSON.stringify({
        shipping_zones: zones.map((z) => ({ name: z.name, fee: Number(z.fee) || 0 })),
        instapay_handle: fd.get("instapay_handle") ?? "",
        vodafone_cash_number: fd.get("vodafone_cash_number") ?? "",
        whatsapp_number: fd.get("whatsapp_number") ?? "",
        instagram_url: fd.get("instagram_url") ?? "",
        accepting_orders: fd.get("accepting_orders") === "on",
      }),
    );
    return saveSettings(prev, fd);
  }, {});

  return (
    <form action={action} className="space-y-6">
      <FormMessage state={state} />

      <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-sans text-base font-semibold">Orders</h2>
        <label className="flex cursor-pointer gap-3">
          <input type="checkbox" name="accepting_orders" defaultChecked={settings.accepting_orders} className="mt-1 h-4 w-4 accent-[var(--rose)]" />
          <span>
            <span className="block text-sm font-medium">Accept new orders</span>
            <span className="block text-xs text-ink-soft">Turn this off during holidays. The shop stays visible but checkout is paused.</span>
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
        <div>
          <h2 className="font-sans text-base font-semibold">Delivery areas</h2>
          <p className="text-sm text-ink-soft">Customers choose one of these at checkout.</p>
        </div>
        <ul className="space-y-2">
          {zones.map((z, i) => (
            <li key={i} className="flex items-center gap-2">
              <input aria-label="Area name" className="field-input flex-1" value={z.name} maxLength={60} onChange={(e) => setZones(zones.map((x, n) => (n === i ? { ...x, name: e.target.value } : x)))} />
              <input aria-label="Delivery fee in EGP" inputMode="decimal" className="field-input w-24" value={z.fee} onChange={(e) => setZones(zones.map((x, n) => (n === i ? { ...x, fee: Number(e.target.value) || 0 } : x)))} />
              <span className="text-sm text-ink-soft">EGP</span>
              <button type="button" aria-label={`Remove ${z.name || "area"}`} className="rounded-full p-2 text-ink-soft hover:text-danger" onClick={() => setZones(zones.filter((_, n) => n !== i))}>
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <Button type="button" variant="ghost" size="sm" onClick={() => setZones([...zones, { name: "", fee: 0 }])}>
          <Plus className="h-4 w-4" /> Add area
        </Button>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
        <div>
          <h2 className="font-sans text-base font-semibold">Transfer payments</h2>
          <p className="text-sm text-ink-soft">Each method appears at checkout only after you fill it in.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="InstaPay address" htmlFor="instapay_handle" optional hint="For example: minniedesign@instapay">
            <input id="instapay_handle" name="instapay_handle" defaultValue={settings.instapay_handle} maxLength={120} className="field-input" />
          </Field>
          <Field label="Vodafone Cash number" htmlFor="vodafone_cash_number" optional>
            <input id="vodafone_cash_number" name="vodafone_cash_number" type="tel" defaultValue={settings.vodafone_cash_number} className="field-input" />
          </Field>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
        <h2 className="font-sans text-base font-semibold">Contact links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="WhatsApp number" htmlFor="whatsapp_number" optional>
            <input id="whatsapp_number" name="whatsapp_number" type="tel" defaultValue={settings.whatsapp_number} className="field-input" />
          </Field>
          <Field label="Instagram link" htmlFor="instagram_url" optional>
            <input id="instagram_url" name="instagram_url" type="url" defaultValue={settings.instagram_url} className="field-input" />
          </Field>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save settings"}</Button>
        {state.ok && <p role="status" className="text-sm text-sage">Saved. The shop shows the change now.</p>}
      </div>
    </form>
  );
}

export function TeamManager({ admins, meId }: { admins: { id: string; email: string }[]; meId: string }) {
  const [addState, addAction, adding] = useActionState<ActionState, FormData>(addAdmin, {});
  const [removeState, removeAction] = useActionState<ActionState, FormData>(removeAdmin, {});
  return (
    <section className="space-y-4 rounded-2xl border border-line bg-card p-5">
      <div>
        <h2 className="font-sans text-base font-semibold">Admins</h2>
        <p className="text-sm text-ink-soft">People who can open this dashboard.</p>
      </div>
      <ul className="divide-y divide-line">
        {admins.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="truncate">{a.email}{a.id === meId && <span className="text-ink-soft"> (you)</span>}</span>
            {a.id !== meId && (
              <form action={removeAction}>
                <input type="hidden" name="user_id" value={a.id} />
                <button type="submit" className="text-danger hover:underline">Remove</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      {removeState.error && <p role="alert" className="text-sm text-danger">{removeState.error}</p>}
      <form action={addAction} className="space-y-2 border-t border-line pt-4">
        <label htmlFor="admin-email" className="text-sm font-medium">Add an admin by email</label>
        <div className="flex gap-2">
          <input id="admin-email" name="email" type="email" className="field-input" placeholder="They need an account first" />
          <Button type="submit" size="sm" variant="secondary" className="h-11" disabled={adding}>Add</Button>
        </div>
        {addState.error && <p role="alert" className="text-sm text-danger">{addState.error}</p>}
        {addState.ok && <p role="status" className="text-sm text-sage">Added</p>}
      </form>
    </section>
  );
}
