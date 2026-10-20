"use client";

import { useActionState } from "react";
import { updateRequest } from "@/app/admin/requests/actions";
import { Button, Field, FormMessage } from "@/components/ui";
import { REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/types";
import type { ActionState } from "@/lib/validation";

export function RequestControls({
  id,
  status,
  quote,
  note,
}: {
  id: string;
  status: RequestStatus;
  quote: number | null;
  note: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateRequest, {});
  return (
    <form action={action} className="space-y-4">
      <FormMessage state={state} />
      <input type="hidden" name="id" value={id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={status} className="field-input">
            {(Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[]).map((s) => (
              <option key={s} value={s}>{REQUEST_STATUS_LABEL[s]}</option>
            ))}
          </select>
        </Field>
        <Field label="Quote (EGP)" htmlFor="quote_amount" optional hint="The customer sees this in their account.">
          <input id="quote_amount" name="quote_amount" inputMode="decimal" defaultValue={quote ?? ""} className="field-input" />
        </Field>
      </div>
      <Field label="Private note" htmlFor="admin_note" optional>
        <textarea id="admin_note" name="admin_note" rows={3} maxLength={2000} defaultValue={note} className="field-input" />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        {state.ok && <p role="status" className="text-sm text-sage">Saved</p>}
      </div>
    </form>
  );
}
