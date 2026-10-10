import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { atlas } from "@/lib/iland/atlas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "iLAND — board" }],
  }),
  component: Board,
});

const facts = [
  ["Pair", "STRK"],
  ["Supply", "1,000,000,000"],
  ["First 20 seconds", "99%"],
  ["After that", "1%"],
  ["Liquidity", "Locked"],
  ["Public launches", "Closed"],
];

const steps = [
  ["01", "Mint", "One billion tokens go straight to the locker.", "/land/parcel-seal.jpg"],
  ["02", "Place", "A one-sided Uniswap v4 range. Zero STRK from the creator.", "/land/parcel-cut.jpg"],
  ["03", "Lock", "The locker has no withdraw. The position stays.", "/land/parcel-terrace.jpg"],
];

const path = [
  ["STRK", "Enters this pool directly."],
  ["ETH / WETH", "Converts through an existing STRK pool first."],
  ["USDC", "Same hop. Not a second pair."],
];

function Board() {
  return (
    <SiteShell>
      <section className="relative overflow-hidden rounded-lg border border-line">
        <img src="/land/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-veil absolute inset-0" />
        <div className="relative flex min-h-96 flex-col items-center justify-center px-5 py-16 text-center">
          <p className="font-mono text-xs tracking-widest text-fg uppercase">Ethereum · Uniswap v4</p>
          <h1 className="mt-4 max-w-4xl font-display text-hero font-extrabold uppercase">
            One side.
            <br />
            Then locked.
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-fg/80">
            Buyers bring the STRK. The creator does not. The opening price is a tick, not a balance in the pool.
          </p>
          <Link
            to="/create"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-accent px-6 font-mono text-xs tracking-widest text-accent-fg uppercase"
          >
            Prepare a launch
          </Link>
        </div>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr_280px]">
        <section className="overflow-hidden rounded-lg border border-line bg-elevated">
          <img src="/land/parcel-north.jpg" alt="" className="h-36 w-full object-cover" />
          <div className="p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-xs tracking-widest text-fg uppercase">iLAND // pool rules</p>
              <span className="font-mono text-xs tracking-widest text-accent uppercase">Live</span>
            </div>
            <dl className="mt-5 grid gap-4">
              {facts.map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
                  <dt className="font-mono text-xs tracking-widest text-subtle uppercase">{label}</dt>
                  <dd className="text-right font-display text-lg font-extrabold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="grid gap-4">
          {steps.map(([n, title, body, image]) => (
            <article key={n} className="flex overflow-hidden rounded-lg border border-line bg-elevated">
              <div className="flex-1 p-5">
                <p className="font-mono text-xs tracking-widest text-accent">{n}</p>
                <h2 className="mt-2 font-display text-title font-extrabold uppercase">{title}</h2>
                <p className="mt-2 max-w-md text-sm text-pretty text-muted">{body}</p>
              </div>
              <img src={image} alt="" className="m-3 size-24 shrink-0 self-center rounded-md object-cover sm:size-28" />
            </article>
          ))}
        </section>

        <section className="rounded-lg border border-line bg-elevated p-4">
          <p className="font-mono text-xs tracking-widest text-fg uppercase">How a buy pays</p>
          <p className="mt-2 text-sm text-muted">This page does not send a swap. There is no public tape.</p>
          <ul className="mt-4 grid gap-3">
            {path.map(([asset, note]) => (
              <li key={asset} className="border-b border-line pb-3">
                <p className="font-display text-lg font-extrabold">{asset}</p>
                <p className="mt-1 text-sm text-muted">{note}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-4">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Atlas · pictures, not pools</h2>
          <Link to="/create" className="font-mono text-xs tracking-widest text-fg uppercase">
            Prepare one
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {atlas.map((parcel) => (
            <article key={parcel.symbol} className="overflow-hidden rounded-lg border border-line bg-elevated">
              <img src={parcel.image} alt="" className="aspect-square w-full object-cover" />
              <div className="grid gap-1 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-extrabold">{parcel.name}</h3>
                  <span className="font-mono text-xs text-muted">{parcel.symbol}</span>
                </div>
                <p className="text-sm text-accent">Not a live pool</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
