import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteShell } from "@/components/site-shell";
import { loadPlots, type Plot } from "@/lib/iland/plots";

export const Route = createFileRoute("/tokens")({
  head: () => ({
    meta: [{ title: "iLAND — tokens" }],
  }),
  component: Tokens,
});

function Tokens() {
  const [plots, setPlots] = useState<Plot[] | null>(null);

  useEffect(() => {
    setPlots(loadPlots());
  }, []);

  return (
    <SiteShell>
      <p className="text-sm font-medium text-muted">Tokens</p>
      <h1 className="mt-2 font-display text-title">What this browser is holding.</h1>
      <p className="mt-3 max-w-xl text-pretty text-muted">
        These are drafts, not pools. Nothing here is trading, and none of it is on Ethereum yet.
      </p>

      {plots === null ? <p className="mt-8 text-sm text-muted">Reading this browser.</p> : null}

      {plots && plots.length === 0 ? (
        <div className="mt-8 overflow-hidden rounded-lg border border-line">
          <img src="/land/hero.jpg" alt="" className="h-48 w-full object-cover" />
          <div className="grid gap-3 p-5">
            <p className="text-pretty text-muted">No draft yet.</p>
            <Link
              to="/create"
              className="inline-flex h-11 w-fit items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg"
            >
              Create one
            </Link>
          </div>
        </div>
      ) : null}

      {plots && plots.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {plots.map((plot) => (
            <article key={plot.id} className="overflow-hidden rounded-lg border border-line bg-elevated">
              <img src={plot.image} alt="" className="aspect-square w-full object-cover" />
              <div className="grid gap-1 p-3">
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg leading-tight">{plot.name}</h2>
                  <span className="font-mono text-xs text-muted">{plot.symbol}</span>
                </div>
                <p className="text-sm text-muted">STRK · draft</p>
                <p className="line-clamp-2 text-sm text-subtle">{plot.note || "No note."}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </SiteShell>
  );
}
