import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Figtree, Pinyon_Script } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

const pinyon = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pinyon",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Minnie Design — personalized prints from Port Said",
    template: "%s · Minnie Design",
  },
  description:
    "Business cards, magazines, notebooks and coloring books designed for you and delivered in Port Said and Port Fouad.",
  openGraph: {
    type: "website",
    siteName: "Minnie Design",
    images: ["/images/hero.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8ecea" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1419" },
  ],
};

// Applies the saved or system theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${bodoni.variable} ${figtree.variable} ${pinyon.variable}`}
    >
      <head>
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
