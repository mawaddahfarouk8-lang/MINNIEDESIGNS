"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { SITE_URL } from "@/lib/env";
import { allow, clientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { fieldErrors, type ActionState } from "@/lib/validation";

// Only same-site relative paths, so ?next= can't redirect to another site.
function safeNext(value: FormDataEntryValue | null, fallback = "/account") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}

const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")).pipe(z.string().max(190));
const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.")
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Use both letters and numbers.");

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({ email, password: z.string().min(1, "Enter your password.").max(72) })
    .safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const ip = await clientIp();
  const [ipOk, accountOk] = await Promise.all([
    allow("login", ip),
    allow("loginAccount", parsed.data.email),
  ]);
  if (!ipOk || !accountOk) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Confirm your email first. Check your inbox for the link we sent." };
    }
    return { error: "That email and password don't match. Try again or reset your password." };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z
    .object({
      full_name: z.string().trim().min(2, "Enter your name.").max(100),
      email,
      password,
    })
    .safeParse({
      full_name: formData.get("full_name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  if (!(await allow("signup", await clientIp()))) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=/account`,
    },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { error: "An account with this email already exists. Sign in instead." };
    }
    if (error.code === "weak_password") {
      return { fieldErrors: { password: "Choose a stronger password with letters and numbers." } };
    }
    console.error("sign up failed", error.code);
    return { error: "We couldn't create your account. Try again in a moment." };
  }

  if (data.session) redirect(safeNext(formData.get("next")));
  return { ok: true };
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = email.safeParse(formData.get("email"));
  if (!parsed.success) return { fieldErrors: { email: "Enter a valid email address." } };

  const ip = await clientIp();
  if (!(await allow("passwordReset", `${ip}:${parsed.data}`))) return { error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });
  // Same answer whether or not the account exists.
  return { ok: true };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = password.safeParse(formData.get("password"));
  if (!parsed.success) return { fieldErrors: { password: parsed.error.issues[0].message } };

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link expired. Request a new one." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) {
    return {
      error:
        error.code === "same_password"
          ? "Choose a password you haven't used before."
          : "We couldn't update your password. Request a new reset link.",
    };
  }
  redirect("/account?password=updated");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
