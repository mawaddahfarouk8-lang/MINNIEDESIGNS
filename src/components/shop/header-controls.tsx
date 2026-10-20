"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Menu, Moon, ShoppingBag, Sun, X } from "lucide-react";
import { useCart } from "@/components/cart/cart-provider";
import { NAV } from "@/lib/nav";


export function NavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className={className}>
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-2 text-[0.95rem] transition-colors hover:text-rose ${
              active ? "text-rose" : "text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CartButton() {
  const { count, ready } = useCart();
  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-petal-soft hover:text-rose"
      aria-label={ready && count > 0 ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="h-5 w-5" strokeWidth={1.6} />
      {ready && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[0.7rem] font-semibold text-card dark:text-paper">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

// The theme lives on <html data-theme>, set before paint by the root layout.
function subscribeTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => null,
  );

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-petal-soft hover:text-rose"
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" strokeWidth={1.6} />
      ) : (
        <Moon className="h-5 w-5" strokeWidth={1.6} />
      )}
    </button>
  );
}

export function MobileMenu({ account }: { account: React.ReactNode }) {
  const pathname = usePathname();
  // Remembers which page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (fn: (v: boolean) => boolean) => setOpenOn(fn(open) ? pathname : null);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-petal-soft"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b border-line bg-paper px-4 pb-5 pt-2 shadow-soft"
        >
          <NavLinks className="flex flex-col" />
          <div className="mt-2 border-t border-line pt-3">{account}</div>
        </div>
      )}
    </div>
  );
}
