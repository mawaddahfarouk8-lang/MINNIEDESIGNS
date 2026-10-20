"use client";

import { useActionState } from "react";
import { updateProfile } from "@/app/(shop)/account/actions";
import { Button, Field, FormMessage } from "@/components/ui";
import type { ActionState } from "@/lib/validation";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4" noValidate>
      <FormMessage state={state} />
      <Field label="Name" htmlFor="full_name" error={e.full_name}>
        <input id="full_name" name="full_name" defaultValue={name} className="field-input" maxLength={100} autoComplete="name" />
      </Field>
      <Field label="Mobile number" htmlFor="phone" optional error={e.phone} hint="Used to fill in checkout.">
        <input id="phone" name="phone" type="tel" defaultValue={phone} className="field-input" autoComplete="tel" />
      </Field>
      <Field label="Email" htmlFor="email-ro">
        <input id="email-ro" value={email} readOnly className="field-input opacity-70" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        {state.ok && <p role="status" className="text-sm text-sage">Saved</p>}
      </div>
    </form>
  );
}
