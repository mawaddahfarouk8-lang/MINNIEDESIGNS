import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/app/(shop)/(auth)/actions";
import { requireUser } from "@/lib/auth";
import { formatDate, money } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ORDER_STATUS_LABEL, REQUEST_STATUS_LABEL, orderTone } from "@/lib/types";
import { Badge, Button, ButtonLink, Container } from "@/components/ui";
import { ProfileForm } from "@/components/shop/profile-form";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

async function AccountContent({ searchParams }: { searchParams: Promise<{ password?: string }> }) {
  const user = await requireUser();
  const supabase = await createClient();
  const [{ data: profile }, { data: orders }, { data: requests }, sp] = await Promise.all([
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
    supabase
      .from("orders")
      .select("order_number, order_status, total, created_at, order_items(count)")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("custom_requests")
      .select("reference, status, created_at, quote_amount")
      .order("created_at", { ascending: false })
      .limit(20),
    searchParams,
  ]);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-5xl">Hi {profile?.full_name.split(" ")[0] || "there"}</h1>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            Sign out
          </Button>
        </form>
      </div>
      {sp.password === "updated" && (
        <p role="status" className="mt-6 rounded-xl bg-sage-soft px-4 py-3 text-sage">
          Your password is updated.
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_340px]">
        <div className="space-y-12">
          <section aria-labelledby="orders-heading">
            <h2 id="orders-heading" className="text-3xl">Orders</h2>
            {orders && orders.length > 0 ? (
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {orders.map((o) => (
                  <li key={o.order_number}>
                    <Link
                      href={`/account/orders/${o.order_number}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-rose"
                    >
                      <div>
                        <p className="font-medium tracking-wide">{o.order_number}</p>
                        <p className="text-sm text-ink-soft">
                          {formatDate(o.created_at)} · {o.order_items[0]?.count ?? 0} items
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge tone={orderTone(o.order_status)}>{ORDER_STATUS_LABEL[o.order_status]}</Badge>
                        <span className="tabular-nums">{money(o.total)}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 rounded-2xl border border-dashed border-line p-6">
                <p className="text-ink-soft">Orders you place while signed in show up here.</p>
                <ButtonLink href="/shop" size="sm" className="mt-4">
                  Browse the shop
                </ButtonLink>
              </div>
            )}
          </section>

          {requests && requests.length > 0 && (
            <section aria-labelledby="requests-heading">
              <h2 id="requests-heading" className="text-3xl">Custom requests</h2>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {requests.map((r) => (
                  <li key={r.reference} className="flex flex-wrap items-center justify-between gap-3 py-4">
                    <div>
                      <p className="font-medium tracking-wide">{r.reference}</p>
                      <p className="text-sm text-ink-soft">{formatDate(r.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {r.quote_amount !== null && <span className="tabular-nums">Quote {money(r.quote_amount)}</span>}
                      <Badge>{REQUEST_STATUS_LABEL[r.status]}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="h-fit space-y-6 rounded-2xl bg-card p-6 shadow-soft">
          <h2 className="text-2xl">Your details</h2>
          <ProfileForm name={profile?.full_name ?? ""} phone={profile?.phone ?? ""} email={user.email} />
          <Link href="/forgot-password" className="block border-t border-line pt-4 text-sm text-ink-soft hover:text-rose">
            Change password
          </Link>
        </aside>
      </div>
    </>
  );
}

export default function AccountPage({ searchParams }: PageProps<"/account">) {
  return (
    <Container className="pt-12">
      <Suspense fallback={<div className="h-96" aria-busy="true" />}>
        <AccountContent searchParams={searchParams as Promise<{ password?: string }>} />
      </Suspense>
    </Container>
  );
}
