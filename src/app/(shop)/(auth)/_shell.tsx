import { Suspense } from "react";
import { Container } from "@/components/ui";

export function AuthShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <Container className="pt-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-5xl">{title}</h1>
        {intro && <p className="mt-3 text-ink-soft">{intro}</p>}
        <div className="mt-8 rounded-2xl bg-card p-6 shadow-soft sm:p-8">
          <Suspense fallback={<div className="h-64" />}>{children}</Suspense>
        </div>
      </div>
    </Container>
  );
}
