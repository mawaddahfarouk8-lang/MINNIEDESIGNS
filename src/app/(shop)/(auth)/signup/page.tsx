import type { Metadata } from "next";
import { SignUpForm } from "@/components/shop/auth-forms";
import { AuthShell } from "../_shell";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function SignUpPage() {
  return (
    <AuthShell title="Create an account" intro="Keep all your orders in one place.">
      <SignUpForm />
    </AuthShell>
  );
}
