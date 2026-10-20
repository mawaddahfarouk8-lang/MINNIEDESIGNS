import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { getSettings } from "@/lib/catalog";
import { whatsappLink } from "@/lib/format";
import { Container } from "@/components/ui";

export async function SiteFooter() {
  "use cache";
  cacheLife("hours");
  cacheTag("settings");
  const settings = await getSettings();

  return (
    <footer className="mt-24 border-t border-line bg-petal-soft/60">
      <Container className="grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm space-y-3">
          <p className="font-display text-2xl italic">minnie design</p>
          <p className="text-ink-soft">
            Personalized prints, designed in Port Said. We deliver to{" "}
            {settings.shipping_zones.map((z) => z.name).join(" and ") || "Port Said"}.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold">Shop</h2>
          <ul className="space-y-2 text-ink-soft">
            <li><Link className="hover:text-rose" href="/shop">All products</Link></li>
            <li><Link className="hover:text-rose" href="/custom">Request a custom design</Link></li>
            <li><Link className="hover:text-rose" href="/track">Track an order</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-semibold">Talk to us</h2>
          <ul className="space-y-2 text-ink-soft">
            {settings.instagram_url && (
              <li>
                <a className="hover:text-rose" href={settings.instagram_url} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              </li>
            )}
            {settings.whatsapp_number && (
              <li>
                <a className="hover:text-rose" href={whatsappLink(settings.whatsapp_number)} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </li>
            )}
            <li><Link className="hover:text-rose" href="/account">Your account</Link></li>
          </ul>
        </div>
      </Container>
      <Container className="border-t border-line py-5 text-sm text-ink-soft">
        © {new Date().getFullYear()} Minnie Design
      </Container>
    </footer>
  );
}
