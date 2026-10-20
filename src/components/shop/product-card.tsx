import Image from "next/image";
import Link from "next/link";
import { money } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

export function PrintStack({ images, alt, sizes }: { images: string[]; alt: string; sizes: string }) {
  // The last child sits on top, so reverse to show the first image in front.
  const shown = images.slice(0, 3).reverse();
  if (shown.length === 0) {
    return <div className="print-stack"><div className="bg-petal" /></div>;
  }
  return (
    <div className="print-stack">
      {shown.map((src, i) => (
        <div key={src}>
          <Image
            src={src}
            alt={i === shown.length - 1 ? alt : ""}
            fill
            sizes={sizes}
            className="object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function ProductCard({ product, category }: { product: Product; category?: Category }) {
  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group block rounded-2xl p-3 outline-offset-4 transition-colors hover:bg-card/70"
    >
      <PrintStack
        images={product.images}
        alt={product.name}
        sizes="(min-width: 1024px) 26vw, (min-width: 640px) 40vw, 80vw"
      />
      <div className="mt-4 space-y-1 px-1">
        {category && <p className="text-sm text-ink-soft">{category.name}</p>}
        <h3 className="text-xl text-ink group-hover:text-rose">{product.name}</h3>
        <p className="text-ink">
          <span className="font-medium">From {money(product.price)}</span>{" "}
          <span className="text-sm text-ink-soft">{product.unit}</span>
        </p>
      </div>
    </Link>
  );
}
