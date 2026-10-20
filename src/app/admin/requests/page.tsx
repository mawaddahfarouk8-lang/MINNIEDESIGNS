import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_STATUS_LABEL, type RequestStatus } from "@/lib/types";
import { Badge } from "@/components/ui";
import { PageHeader } from "@/components/admin/page-header";

export const instant = false;

export const metadata: Metadata = { title: "Custom requests" };

export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  await requireAdmin();
  const sp = await searchParams;
  const status = typeof sp.status === "string" && sp.status in REQUEST_STATUS_LABEL ? (sp.status as RequestStatus) : null;

  const supabase = await createClient();
  let query = supabase
    .from("custom_requests")
    .select("id, reference, customer_name, customer_phone, quantity, content, needed_by, status, created_at, categories(name)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);
  const { data: requests } = await query;

  return (
    <>
      <PageHeader title="Custom requests" description="Requests from the custom design form." />
      <nav aria-label="Filter requests" className="mb-6 flex flex-wrap gap-2">
        {[null, ...(Object.keys(REQUEST_STATUS_LABEL) as RequestStatus[])].map((s) => (
          <Link
            key={s ?? "all"}
            href={s ? `/admin/requests?status=${s}` : "/admin/requests"}
            aria-current={s === status ? "page" : undefined}
            className={`rounded-full border px-3.5 py-1.5 text-sm ${
              s === status ? "border-ink bg-ink text-paper" : "border-line bg-card hover:border-rose"
            }`}
          >
            {s ? REQUEST_STATUS_LABEL[s] : "All"}
          </Link>
        ))}
      </nav>

      {requests && requests.length > 0 ? (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {requests.map((r) => (
            <li key={r.id}>
              <Link href={`/admin/requests/${r.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-petal-soft/60 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {r.customer_name} <span className="font-normal text-ink-soft">· {r.categories?.name ?? "Something else"} · {r.quantity} pcs</span>
                  </p>
                  <p className="truncate text-sm text-ink-soft">{r.content}</p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {r.needed_by && <span className="text-ink-soft">Needed {formatDate(r.needed_by)}</span>}
                  <span className="text-ink-soft">{formatDateTime(r.created_at)}</span>
                  <Badge tone={r.status === "new" ? "rose" : r.status === "declined" ? "danger" : r.status === "completed" ? "sage" : "neutral"}>
                    {REQUEST_STATUS_LABEL[r.status]}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl border border-dashed border-line p-8 text-center text-ink-soft">No requests here.</p>
      )}
    </>
  );
}
