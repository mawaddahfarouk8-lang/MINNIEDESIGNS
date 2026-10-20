"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import {
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword,
} from "@/app/(shop)/(auth)/actions";
import { Button, Field, FormMessage } from "@/components/ui";
import type { ActionState } from "@/lib/validation";

function useNext() {
  return useSearchParams().get("next") ?? "";
}

export function SignInForm() {
  const next = useNext();
  const [state, action, pending] = useActionState<ActionState, FormData>(signIn, {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email" error={e.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="field-input" required aria-invalid={Boolean(e.email) || undefined} />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password}>
        <input id="password" name="password" type="password" autoComplete="current-password" className="field-input" required aria-invalid={Boolean(e.password) || undefined} />
      </Field>
      <div className="flex items-center justify-between gap-4">
        <Button type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        <Link href="/forgot-password" className="text-sm text-ink-soft hover:text-rose">
          Forgot your password?
        </Link>
      </div>
      <p className="border-t border-line pt-5 text-sm text-ink-soft">
        New here?{" "}
        <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-rose underline underline-offset-4">
          Create an account
        </Link>
        . You can also order without one.
      </p>
    </form>
  );
}

export function SignUpForm() {
  const next = useNext();
  const [state, action, pending] = useActionState<ActionState, FormData>(signUp, {});
  const e = state.fieldErrors ?? {};

  if (state.ok) {
    return (
      <div role="status" className="space-y-3">
        <h2 className="text-3xl">Check your email</h2>
        <p className="text-ink-soft">We sent you a link to confirm your account. Open it on this device to sign in.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="next" value={next} />
      <FormMessage state={state} />
      <Field label="Full name" htmlFor="full_name" error={e.full_name}>
        <input id="full_name" name="full_name" autoComplete="name" className="field-input" required maxLength={100} aria-invalid={Boolean(e.full_name) || undefined} />
      </Field>
      <Field label="Email" htmlFor="email" error={e.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="field-input" required aria-invalid={Boolean(e.email) || undefined} />
      </Field>
      <Field label="Password" htmlFor="password" error={e.password} hint="At least 8 characters, with letters and numbers.">
        <input id="password" name="password" type="password" autoComplete="new-password" className="field-input" required minLength={8} maxLength={72} aria-invalid={Boolean(e.password) || undefined} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="border-t border-line pt-5 text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-rose underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(requestPasswordReset, {});
  if (state.ok) {
    return (
      <p role="status" className="rounded-xl bg-sage-soft px-4 py-3 text-sage">
        If that email has an account, a reset link is on its way. Check your inbox and spam folder.
      </p>
    );
  }
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <input id="email" name="email" type="email" autoComplete="email" className="field-input" required />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(updatePassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <FormMessage state={state} />
      <Field label="New password" htmlFor="password" error={state.fieldErrors?.password} hint="At least 8 characters, with letters and numbers.">
        <input id="password" name="password" type="password" autoComplete="new-password" className="field-input" required minLength={8} maxLength={72} />
      </Field>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}
