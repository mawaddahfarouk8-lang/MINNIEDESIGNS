import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/shop/auth-forms";
import { AuthShell } from "../_shell";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Reset your password" intro="Enter your email and we'll send you a link to choose a new password.">
      <ForgotPasswordForm />
    </AuthShell>
  );
}
