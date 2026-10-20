import Link from "next/link";
import { Suspense } from "react";
import { UserRound } from "lucide-react";
import { getSessionUser } from "@/lib/auth";
import { Container } from "@/components/ui";
import { NAV } from "@/lib/nav";
import { CartButton, MobileMenu, NavLinks, ThemeToggle } from "./header-controls";

export function Wordmark() {
  return (
    <Link href="/" className="group inline-flex items-baseline gap-1.5" aria-label="Minnie Design home">
      <span className="font-display text-[1.7rem] italic leading-none tracking-tight text-ink group-hover:text-rose">
        minnie
      </span>
      <span className="text-[0.68rem] font-medium tracking-[0.32em] text-rose">design</span>
    </Link>
  );
}

async function AccountLink() {
  const user = await getSessionUser();
  if (!user) {
    return (
      <Link href="/login" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.95rem] hover:text-rose">
        <UserRound className="h-5 w-5" strokeWidth={1.6} />
        Sign in
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-1">
      {user.isAdmin && (
        <Link href="/admin" className="rounded-full px-3 py-2 text-[0.95rem] text-rose hover:bg-petal-soft">
          Dashboard
        </Link>
      )}
      <Link href="/account" className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-[0.95rem] hover:text-rose">
        <UserRound className="h-5 w-5" strokeWidth={1.6} />
        My account
      </Link>
    </div>
  );
}

// Shown while the active-link state streams in on dynamic routes.
function StaticNav({ className }: { className: string }) {
  return (
    <nav aria-label="Main" className={className}>
      {NAV.map((item) => (
        <Link key={item.href} href={item.href} className="rounded-full px-3 py-2 text-[0.95rem] text-ink hover:text-rose">
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AccountFallback() {
  return <span className="inline-block h-10 w-24" aria-hidden />;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper/90 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-card focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Container className="relative flex h-16 items-center justify-between gap-4">
        <Wordmark />
        <Suspense fallback={<StaticNav className="hidden items-center gap-1 md:flex" />}>
          <NavLinks className="hidden items-center gap-1 md:flex" />
        </Suspense>
        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <Suspense fallback={<AccountFallback />}>
              <AccountLink />
            </Suspense>
          </div>
          <ThemeToggle />
          <CartButton />
          <Suspense fallback={<span className="inline-block h-10 w-10 md:hidden" aria-hidden />}>
            <MobileMenu
              account={
                <Suspense fallback={<AccountFallback />}>
                  <AccountLink />
                </Suspense>
              }
            />
          </Suspense>
        </div>
      </Container>
    </header>
  );
}
