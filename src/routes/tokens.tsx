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

type DexPair = {
  priceUsd?: string;
  volume?: { h24?: number };
  liquidity?: { usd?: number };
  priceChange?: { h24?: number };
  url?: string;
  baseToken?: { name?: string; symbol?: string };
};

function Tokens() {
  const [plots, setPlots] = useState<Plot[] | null>(null);
  const [grinta, setGrinta] = useState<DexPair | null>(null);

  useEffect(() => {
    setPlots(loadPlots());
    // Live GRINTA market data
    fetch("https://api.dexscreener.com/latest/dex/tokens/0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73")
      .then((r) => r.json())
      .then((data) => {
        const pair = data?.pairs?.find((p: any) => p.chainId === "ethereum" && p.dexId === "uniswap");
        if (pair) setGrinta(pair);
      })
      .catch(() => {});
  }, []);

  return (
    <SiteShell>
      <p className="text-sm font-medium text-muted">Tokens</p>
      <h1 className="mt-2 font-display text-title">Launchpad</h1>
      <p className="mt-3 max-w-xl text-pretty text-muted">
        Live GRINTA is open. Drafts stay local until you launch.
      </p>

      {/* Featured live GRINTA */}
      <section className="mt-8 overflow-hidden rounded-lg border border-line bg-elevated">
        <div className="grid gap-4 p-5 md:grid-cols-[160px_1fr]">
          <div className="flex items-center justify-center rounded-md bg-[#0b1d36] p-4">
            <img src="/land/grinta.svg" alt="GRINTA" className="h-32 w-32 object-contain" />
          </div>
          <div className="grid gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="font-display text-2xl font-extrabold">GRINTA</h2>
              <span className="font-mono text-xs text-accent">LIVE</span>
            </div>
            <p className="font-mono text-xs text-muted">0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73</p>
            <p className="text-sm text-muted">GRINTA / STRK · Uniswap v4 · Ethereum</p>
            {grinta ? (
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-subtle">Price</p>
                  <p className="font-medium">${Number(grinta.priceUsd || 0).toFixed(8)}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">24h Vol</p>
                  <p className="font-medium">${(grinta.volume?.h24 || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-subtle">Liq</p>
                  <p className="font-medium">${(grinta.liquidity?.usd || 0).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">Loading market data…</p>
            )}
            <div className="flex gap-2">
              <a
                href="https://etherscan.io/address/0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73"
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center rounded-sm border border-line px-3 text-xs font-medium"
              >
                Contract
              </a>
              <a
                href={grinta?.url || "https://dexscreener.com/ethereum/0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center rounded-sm bg-accent px-3 text-xs font-medium text-accent-fg"
              >
                Trade
              </a>
            </div>
          </div>
        </div>
      </section>

      <h2 className="mt-10 font-display text-lg">Drafts</h2>
      <p className="mt-1 text-sm text-muted">Local only. Nothing here is on-chain yet.</p>

      {plots === null ? <p className="mt-8 text-sm text-muted">Reading this browser.</p> : null}

      {plots && plots.length === 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-line">
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
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
