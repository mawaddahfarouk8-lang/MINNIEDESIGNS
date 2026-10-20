import Image from "next/image";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/catalog";
import { ButtonLink, Container } from "@/components/ui";
import { ProductCard } from "@/components/shop/product-card";

const STEPS = [
  {
    title: "Choose and personalize",
    body: "Pick a design, choose the paper and size, and add your name or details. Business cards show a live preview.",
  },
  {
    title: "Pay the way you like",
    body: "Pay the courier in cash, or send the total by InstaPay or Vodafone Cash and upload the transfer screenshot.",
  },
  {
    title: "We print and deliver",
    body: "We confirm your order, print it, and bring it to your door in Port Said or Port Fouad. Track it any time with your order number.",
  },
];

export default async function HomePage() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const featured = products.filter((p) => p.is_featured).slice(0, 3);
  const countFor = (id: number) => products.filter((p) => p.category_id === id).length;

  return (
    <>
      <section className="overflow-hidden">
        <Container className="grid items-center gap-12 pb-16 pt-10 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-16">
          <div className="max-w-xl">
            <h1 className="text-[2.75rem] leading-[1.02] sm:text-6xl lg:text-[4.6rem]">
              Prints made with your name on them
            </h1>
            <p className="mt-6 max-w-md text-lg text-ink-soft">
              Business cards, magazines, notebooks and coloring books, designed for you and
              delivered across Port Said and Port Fouad.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/shop">Browse the shop</ButtonLink>
              <ButtonLink href="/custom" variant="secondary">
                Request a custom design
              </ButtonLink>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-md md:max-w-none">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-3 rounded-md bg-petal" aria-hidden />
            <div className="relative -rotate-2 rounded-md border-[10px] border-card bg-card shadow-soft">
              <Image
                src="/images/hero.jpg"
                alt="The Minnie Design studio with a personalized coloring book, notebook and branded laptop"
                width={940}
                height={627}
                priority
                sizes="(min-width: 768px) 48vw, 92vw"
                className="h-auto w-full rounded-sm"
              />
            </div>
          </div>
        </Container>
      </section>

      <section aria-labelledby="categories-heading" className="border-y border-line bg-card/60">
        <Container className="py-10">
          <h2 id="categories-heading" className="sr-only">
            Categories
          </h2>
          <ul className="flex flex-wrap gap-x-10 gap-y-4">
            {categories.map((c) => {
              const n = countFor(c.id);
              return (
                <li key={c.id}>
                  <Link href={`/shop?category=${c.slug}`} className="group inline-flex flex-wrap items-baseline gap-x-2">
                    <span className="font-display text-2xl group-hover:text-rose">{c.name}</span>
                    <span className="text-sm text-ink-soft">
                      {n > 0 ? `${n} ${n === 1 ? "design" : "designs"}` : "made to order"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured-heading">
          <Container className="py-20">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 id="featured-heading" className="text-4xl sm:text-5xl">
                Favorites
              </h2>
              <Link href="/shop" className="text-rose underline-offset-4 hover:underline">
                See all products
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProductCard key={p.id} product={p} category={categories.find((c) => c.id === p.category_id)} />
              ))}
            </div>
          </Container>
        </section>
      )}

      <section aria-labelledby="how-heading" className="bg-card">
        <Container className="py-20">
          <h2 id="how-heading" className="max-w-lg text-4xl sm:text-5xl">
            How ordering works
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t border-line pt-6">
                <span className="font-display text-5xl italic text-rose">{i + 1}</span>
                <h3 className="mt-3 font-sans text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-ink-soft">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section>
        <Container className="py-20">
          <div className="grid items-center gap-8 rounded-3xl bg-ink px-6 py-12 text-paper sm:px-12 md:grid-cols-[1.5fr_1fr]">
            <div>
              <h2 className="text-4xl sm:text-5xl">Have something else in mind?</h2>
              <p className="mt-4 max-w-lg text-paper/80">
                Tell us what you need: invitations, tableaux, giveaways or a design for your brand.
                We reply with a price and a timeline.
              </p>
            </div>
            <div className="md:text-right">
              <Link
                href="/custom"
                className="inline-flex h-12 items-center rounded-full bg-paper px-7 font-medium text-ink hover:bg-petal"
              >
                Request a custom design
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
