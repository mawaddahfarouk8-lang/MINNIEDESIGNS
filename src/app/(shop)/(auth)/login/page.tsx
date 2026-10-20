import type { Metadata } from "next";
import { SignInForm } from "@/components/shop/auth-forms";
import { AuthShell } from "../_shell";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default function LoginPage() {
  return (
    <AuthShell title="Sign in" intro="See your orders and check out faster.">
      <SignInForm />
    </AuthShell>
  );
}
