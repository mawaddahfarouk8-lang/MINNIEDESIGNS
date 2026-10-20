"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PenTool, Settings, ShoppingBag, Tags } from "lucide-react";

const ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/requests", label: "Custom requests", icon: PenTool },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminNav({ badges }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        const count = badges?.[href];
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-ink text-paper" : "text-ink hover:bg-petal-soft"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
            {count ? (
              <span
                className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                  active ? "bg-paper text-ink" : "bg-rose text-card dark:text-paper"
                }`}
              >
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
