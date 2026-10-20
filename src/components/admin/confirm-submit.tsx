"use client";

import { Button } from "@/components/ui";

export function ConfirmSubmit({ message, children }: { message: string; children: React.ReactNode }) {
  return (
    <Button
      type="submit"
      variant="danger"
      size="sm"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
