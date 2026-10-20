import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/lib/database.types";

// Service-role client. Bypasses RLS, so it is only used for operations the
// app has already authorized: placing orders, storing uploads, rate limiting,
// guest order tracking and admin team management.
export function createAdminClient() {
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error("Missing environment variable: SUPABASE_SECRET_KEY");
  }

  return createClient<Database>(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
