import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MessageCircle, Phone } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, whatsappLink } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { REQUEST_STATUS_LABEL } from "@/lib/types";
import { Badge, buttonClass } from "@/components/ui";
import { Panel } from "@/components/admin/page-header";
import { RequestControls } from "@/components/admin/request-controls";

export const instant = false;

export const metadata: Metadata = { title: "Custom request" };

export default async function AdminRequestPage({ params }: PageProps<"/admin/requests/[id]">) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await createClient();
  const { data: r } = await supabase
    .from("custom_requests")
    .select("*, categories(name)")
    .eq("id", id)
    .maybeSingle();
  if (!r) notFound();

  let fileUrl: string | null = null;
  if (r.attachment_path) {
    const { data } = await supabase.storage.from("request-files").createSignedUrl(r.attachment_path, 600);
    fileUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <Link href="/admin/requests" className="text-sm text-ink-soft hover:text-rose">Custom requests</Link>
      <div className="mb-8 mt-1 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl">{r.categories?.name ?? "Custom design"} for {r.customer_name.split(" ")[0]}</h1>
          <p className="mt-1 text-ink-soft">{r.reference} · received {formatDateTime(r.created_at)}</p>
        </div>
        <Badge tone={r.status === "new" ? "rose" : "neutral"}>{REQUEST_STATUS_LABEL[r.status]}</Badge>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Panel title="What they need">
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[140px_1fr]">
              <dt className="text-ink-soft">Quantity</dt><dd>{r.quantity}</dd>
              <dt className="text-ink-soft">Content</dt><dd className="whitespace-pre-wrap">{r.content}</dd>
              {r.style && (<><dt className="text-ink-soft">Colors and style</dt><dd>{r.style}</dd></>)}
              {r.needed_by && (<><dt className="text-ink-soft">Needed by</dt><dd>{formatDate(r.needed_by)}</dd></>)}
              {r.notes && (<><dt className="text-ink-soft">Notes</dt><dd className="whitespace-pre-wrap">{r.notes}</dd></>)}
            </dl>
            {fileUrl && (
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="mt-5 block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileUrl} alt="Reference image from the customer" className="max-h-80 rounded-lg border border-line object-contain" />
                <span className="mt-1 block text-xs text-ink-soft">Open full size. The link expires in 10 minutes.</span>
              </a>
            )}
          </Panel>
          <Panel title="Manage">
            <RequestControls id={r.id} status={r.status} quote={r.quote_amount === null ? null : Number(r.quote_amount)} note={r.admin_note ?? ""} />
          </Panel>
        </div>
        <Panel title="Customer" className="h-fit">
          <p className="font-medium">{r.customer_name}</p>
          <p className="tabular-nums text-ink-soft">{r.customer_phone}</p>
          {r.customer_email && <p className="text-ink-soft">{r.customer_email}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`tel:${r.customer_phone}`} className={buttonClass("secondary", "sm")}><Phone className="h-4 w-4" /> Call</a>
            <a
              href={whatsappLink(r.customer_phone, `Hi ${r.customer_name.split(" ")[0]}, this is Minnie Design about your custom request ${r.reference}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("secondary", "sm")}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </Panel>
      </div>
    </>
  );
}
