import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/shop/auth-forms";
import { AuthShell } from "../_shell";

export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password">
      <ResetPasswordForm />
    </AuthShell>
  );
}
