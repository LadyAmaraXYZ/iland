import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { STRK, STRK_URL } from "@/lib/iland/constants";
import { loadPlots } from "@/lib/iland/plots";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "iLAND — profile" }],
  }),
  component: Profile,
});

function Profile() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    setCount(loadPlots().length);
  }, []);

  return (
    <SiteShell>
      <section className="overflow-hidden rounded-lg border border-line">
        <img src="/land/hero.jpg" alt="" className="h-40 w-full object-cover" />
        <div className="grid gap-2 p-5">
          <p className="text-sm font-medium text-muted">Profile</p>
          <h1 className="font-display text-title">No wallet on this pad.</h1>
          <p className="max-w-xl text-pretty text-muted">
            iLAND does not connect a wallet yet, and it does not ask for a private key. Drafts
            stay in this browser. The factory is not on Ethereum.
          </p>
        </div>
      </section>

      <dl className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
        <div className="bg-bg px-4 py-4">
          <dt className="text-sm text-muted">Drafts here</dt>
          <dd className="mt-1 font-display text-stat">{count === null ? "—" : count}</dd>
        </div>
        <div className="bg-bg px-4 py-4">
          <dt className="text-sm text-muted">Pair</dt>
          <dd className="mt-1 font-display text-stat">STRK</dd>
        </div>
        <div className="bg-bg px-4 py-4">
          <dt className="text-sm text-muted">Launches</dt>
          <dd className="mt-1 font-display text-stat">Closed</dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/create"
          className="inline-flex h-11 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          Create
        </Link>
        <Link
          to="/tokens"
          className="inline-flex h-11 items-center rounded-sm border border-line px-4 text-sm"
        >
          Tokens
        </Link>
        <a
          href={STRK_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
        >
          {STRK.slice(0, 6)}…{STRK.slice(-4)}
        </a>
      </div>
    </SiteShell>
  );
}
