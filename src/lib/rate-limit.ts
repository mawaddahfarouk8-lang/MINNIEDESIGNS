import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type Rule = { max: number; windowSeconds: number };

export const LIMITS = {
  login: { max: 8, windowSeconds: 15 * 60 },
  loginAccount: { max: 5, windowSeconds: 15 * 60 },
  signup: { max: 5, windowSeconds: 60 * 60 },
  passwordReset: { max: 3, windowSeconds: 60 * 60 },
  placeOrder: { max: 10, windowSeconds: 60 * 60 },
  trackOrder: { max: 20, windowSeconds: 15 * 60 },
  customRequest: { max: 5, windowSeconds: 60 * 60 },
  cardPhoto: { max: 20, windowSeconds: 60 * 60 },
} satisfies Record<string, Rule>;

// On Vercel, x-real-ip and x-forwarded-for are set by the edge network and
// cannot be overridden by the client.
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-real-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

// Returns true when the action may proceed. Fails closed: if the limiter
// cannot be reached, the action is refused.
export async function allow(bucket: keyof typeof LIMITS, subject: string) {
  const rule = LIMITS[bucket];
  const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
    p_key: `${bucket}:${subject}`.slice(0, 200),
    p_max: rule.max,
    p_window_seconds: rule.windowSeconds,
  });
  if (error) {
    console.error("rate limit check failed", error.message);
    return false;
  }
  return data === true;
}

export const RATE_LIMIT_MESSAGE =
  "Too many attempts. Wait a few minutes and try again.";
