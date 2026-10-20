import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ShippingZone } from "@/lib/types";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsForm, TeamManager } from "@/components/admin/settings-form";

export const instant = false;

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const me = await requireAdmin();
  const supabase = await createClient();
  const { data: settings } = await supabase.from("store_settings").select("*").single();

  // Admin emails live in auth.users, which only the service role can read.
  const service = createAdminClient();
  const { data: adminRows } = await service.from("admins").select("user_id");
  const admins = await Promise.all(
    (adminRows ?? []).map(async (a) => {
      const { data } = await service.auth.admin.getUserById(a.user_id);
      return { id: a.user_id, email: data.user?.email ?? "Unknown" };
    }),
  );

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {settings && (
          <SettingsForm settings={{ ...settings, shipping_zones: (settings.shipping_zones ?? []) as ShippingZone[] }} />
        )}
        <div className="h-fit">
          <TeamManager admins={admins} meId={me.id} />
        </div>
      </div>
    </>
  );
}
