import { createFileRoute, Link } from "@tanstack/react-router";
import { LaunchDesk } from "@/components/launch-desk";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "iLAND — opening price desk" }],
  }),
  component: Home,
});

const facts = [
  ["1,000,000,000", "Token supply"],
  ["1%", "Swap fee"],
  ["200", "Tick spacing"],
  ["0", "STRK from the creator"],
];

function Home() {
  return (
    <SiteShell>
      <section className="grid gap-6 border-b border-line pb-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="text-sm font-medium text-muted">Ethereum launchpad</p>
          <h1 className="mt-3 font-display text-hero">
            The pool starts with tokens. STRK comes from buyers.
          </h1>
        </div>
        <div className="lg:col-span-5">
          <p className="text-pretty text-muted">
            iLAND mints one billion tokens into a locker and places them in a one-sided Uniswap v4
            range against STRK. Displayed market cap is the opening price times supply. It is not
            STRK sitting in the pool.
          </p>
          <p className="mt-3 text-sm text-pretty text-muted">
            Public launches are closed. The factory is not deployed, and the pool has no anti-snipe
            hook. This desk only prepares the tick.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button asChild variant="secondary">
              <Link to="/mechanism">Read the rules</Link>
            </Button>
            <Link to="/place" className="inline-flex h-11 items-center text-sm text-fg underline-offset-4 hover:underline">
              Where it sits
            </Link>
          </div>
        </div>
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-4">
        {facts.map(([value, label]) => (
          <div key={label} className="bg-bg px-4 py-4">
            <dt className="font-display text-xl tabular-nums">{value}</dt>
            <dd className="mt-1 text-sm text-muted">{label}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10">
        <LaunchDesk />
      </div>
    </SiteShell>
  );
}
