import { createFileRoute, Link } from "@tanstack/react-router";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { FACTORY } from "@/lib/iland/constants";
import { factoryAbi, tokenAbi } from "@/lib/iland/abis";
import { useEffect, useState } from "react";
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
  ["Public launches", "Open"],
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
            Launch token
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


      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="font-mono text-xs tracking-widest text-muted uppercase">Live launches</h2>
          <Link to="/tokens" className="font-mono text-xs tracking-widest text-fg uppercase">
            All tokens
          </Link>
        </div>
        <LiveGrinta />\n        <RobinhoodCABox />\n        <FactoryTokens />
      </section>

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



function FactoryTokens() {
  const [tokens, setTokens] = useState<{address: string; name: string; symbol: string}[]>([]);

  useEffect(() => {
    const client = createPublicClient({ chain: mainnet, transport: http() });
    (async () => {
      try {
        const count = await client.readContract({
          address: FACTORY as `0x${string}`,
          abi: factoryAbi,
          functionName: "launchCount",
        });
        const list = [];
        for (let i = 0; i < Number(count); i++) {
          const addr = await client.readContract({
            address: FACTORY as `0x${string}`,
            abi: factoryAbi,
            functionName: "tokenAt",
            args: [BigInt(i)],
          });
          const [name, symbol] = await Promise.all([
            client.readContract({ address: addr as `0x${string}`, abi: tokenAbi, functionName: "name" }),
            client.readContract({ address: addr as `0x${string}`, abi: tokenAbi, functionName: "symbol" }),
          ]);
          list.push({ address: addr as string, name: name as string, symbol: symbol as string });
        }
        setTokens(list.reverse());
      } catch {}
    })();
  }, []);

  if (tokens.length === 0) return null;

  return (
    <div className="mt-4 grid gap-3">
      {tokens.map((t) => (
        <article key={t.address} className="rounded-lg border border-line bg-elevated p-4">
          <div className="flex items-baseline justify-between">
            <h3 className="font-display text-xl font-extrabold">{t.name}</h3>
            <span className="font-mono text-xs text-accent">{t.symbol}</span>
          </div>
          <p className="mt-1 font-mono text-xs text-muted">{t.address}</p>
          <a href={`https://dexscreener.com/ethereum/${t.address}`} target="_blank" className="mt-2 inline-block text-sm text-accent">
            Trade
          </a>
        </article>
      ))}
    </div>
  );
}


function RobinhoodCABox() {
  const [ca, setCa] = useState("");
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem("rh-cas");
    if (raw) setSaved(JSON.parse(raw));
  }, []);

  function add() {
    const clean = ca.trim();
    if (!/^0x[a-fA-F0-9]{40}$/.test(clean)) return;
    const next = [clean, ...saved.filter((x) => x.toLowerCase() !== clean.toLowerCase())];
    setSaved(next);
    localStorage.setItem("rh-cas", JSON.stringify(next));
    setCa("");
  }

  return (
    <section className="mt-4 rounded-lg border border-line bg-elevated p-4">
      <p className="font-mono text-xs tracking-widest text-muted uppercase">Robinhood Chain CA</p>
      <div className="mt-3 flex gap-2">
        <input
          value={ca}
          onChange={(e) => setCa(e.target.value)}
          placeholder="0x... (paste CA)"
          className="flex-1 rounded-sm border border-line bg-surface px-3 py-2 font-mono text-sm"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          Add
        </button>
      </div>
      <ul className="mt-3 grid gap-2">
        {saved.map((addr) => (
          <li key={addr} className="flex items-center justify-between gap-2 text-sm">
            <a
              href={`https://robin.etherscan.io/address/${addr}`}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-accent"
            >
              {addr.slice(0, 6)}…{addr.slice(-4)}
            </a>
            <a
              href={`https://app.uniswap.org/explore/tokens/robinhood/${addr}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted"
            >
              Uniswap
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LiveGrinta() {
  const [pair, setPair] = useState<any>(null);

  useEffect(() => {
    fetch("https://api.dexscreener.com/latest/dex/tokens/0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73")
      .then((r) => r.json())
      .then((data) => {
        const p = data?.pairs?.find((x: any) => x.chainId === "ethereum" && x.dexId === "uniswap");
        if (p) setPair(p);
      })
      .catch(() => {});
  }, []);

  return (
    <article className="overflow-hidden rounded-lg border border-line bg-elevated">
      <div className="grid gap-4 p-5 md:grid-cols-[120px_1fr_auto]">
        <div className="flex items-center justify-center rounded-md bg-[#0b1d36] p-3">
          <img src="/land/grinta.svg" alt="GRINTA" className="h-24 w-24 object-contain" />
        </div>
        <div className="grid gap-2">
          <div className="flex items-baseline gap-3">
            <h3 className="font-display text-2xl font-extrabold">GRINTA</h3>
            <span className="font-mono text-xs text-accent">LIVE</span>
          </div>
          <p className="font-mono text-xs text-muted">0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73</p>
          <p className="text-sm text-muted">GRINTA / STRK · Uniswap v4</p>
          {pair ? (
            <div className="mt-1 flex flex-wrap gap-4 text-sm">
              <span>${Number(pair.priceUsd || 0).toFixed(8)}</span>
              <span className="text-muted">Vol ${ (pair.volume?.h24 || 0).toLocaleString() }</span>
              <span className="text-muted">Liq ${ (pair.liquidity?.usd || 0).toLocaleString() }</span>
            </div>
          ) : (
            <p className="text-sm text-muted">Loading…</p>
          )}
        </div>
        <div className="flex items-center">
          <a
            href={pair?.url || "https://dexscreener.com/ethereum/0x7b5D1BB276952b2767Dac420A42b6c3326BF6A73"}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Trade
          </a>
        </div>
      </div>
    </article>
  );
}

