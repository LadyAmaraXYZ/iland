import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { atlas } from "@/lib/iland/atlas";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "iLAND — board" }],
  }),
  component: Board,
});

function Board() {
  return (
    <SiteShell>
      <section className="overflow-hidden rounded-lg border border-line">
        <div className="relative min-h-72">
          <img src="/land/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/55 to-bg/10" />
          <div className="relative flex min-h-72 flex-col justify-end p-5 sm:p-8">
            <p className="text-sm font-medium text-fg">Ethereum launchpad</p>
            <h1 className="mt-2 max-w-xl font-display text-hero">Open a plot against STRK.</h1>
            <p className="mt-3 max-w-lg text-pretty text-muted">
              One billion tokens. One Uniswap v4 position. Buyers bring the STRK. Nothing on this
              board has been launched.
            </p>
          </div>
        </div>
      </section>

      <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        {[
          ["01", "Name the token", "Picture, ticker, a short note. It stays in this browser."],
          ["02", "Set the opening", "The desk writes the tick. Displayed cap is not STRK in the pool."],
          ["03", "Wait for the hook", "No public launch until the first block is protected."],
        ].map(([n, title, body]) => (
          <li key={n} className="bg-bg px-4 py-4">
            <p className="font-mono text-sm text-accent">{n}</p>
            <p className="mt-2 font-medium">{title}</p>
            <p className="mt-1 text-sm text-pretty text-muted">{body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex items-end justify-between gap-4">
        <h2 className="font-display text-title">Atlas</h2>
        <Link to="/create" className="text-sm text-fg underline-offset-4 hover:underline">
          Prepare one
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {atlas.map((parcel) => (
          <article key={parcel.symbol} className="overflow-hidden rounded-lg border border-line bg-elevated">
            <img src={parcel.image} alt="" className="aspect-square w-full object-cover" />
            <div className="grid gap-1 p-3">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-lg leading-tight">{parcel.name}</h3>
                <span className="font-mono text-xs text-muted">{parcel.symbol}</span>
              </div>
              <p className="text-sm text-muted">STRK · {parcel.opening}</p>
              <p className="text-sm text-accent">Not launched</p>
            </div>
          </article>
        ))}
      </div>
    </SiteShell>
  );
}
