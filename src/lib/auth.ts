import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

// Verifies the session with the Auth server, then checks admin membership
// through RLS. Cached per request.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: isAdmin } = await supabase.rpc("is_admin");

  return {
    id: data.user.id,
    email: data.user.email ?? "",
    isAdmin: isAdmin === true,
  };
});

export async function requireUser(next = "/account") {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}
