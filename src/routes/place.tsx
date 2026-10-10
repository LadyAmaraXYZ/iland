import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/place")({
  head: () => ({
    meta: [{ title: "iLAND — the second machine" }],
  }),
  component: Place,
});

const rows: { pads: string; machine: string; quote: string; when: string; here?: boolean }[] = [
  {
    pads: "Trench, Klik, Livo, Stroid, Printr",
    machine: "Curve, then graduation",
    quote: "ETH. Some of them a stock.",
    when: "Moves to a DEX when the curve fills",
  },
  {
    pads: "Clanker",
    machine: "One-sided Uniswap v4",
    quote: "ETH",
    when: "The first block",
  },
  {
    pads: "Stockereum",
    machine: "One-sided Uniswap v4",
    quote: "A stock token",
    when: "The first block",
  },
  {
    pads: "Moto.fun, Sender",
    machine: "Separate pads, same list",
    quote: "Mixed",
    when: "Depends on the pad",
  },
  {
    pads: "iLAND",
    machine: "One-sided Uniswap v4",
    quote: "Ethereum STRK only",
    when: "The first block, once a hook is on",
    here: true,
  },
];

function Place() {
  return (
    <SiteShell>
      <article>
        <p className="text-sm font-medium text-muted">Field</p>
        <h1 className="mt-3 max-w-3xl font-display text-hero">The second machine.</h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-muted">
          GMGN’s Ethereum trench has two families. iLAND is in the second. The market exists in the
          first block. The quote is only the STRK contract on Ethereum.
        </p>

        <div className="mt-10 hidden md:grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,1.15fr)] md:gap-px md:overflow-hidden md:rounded-lg md:border md:border-line md:bg-line">
          {["Pad", "Machine", "Quote", "When it trades"].map((label) => (
            <div key={label} className="bg-elevated px-4 py-3 text-sm font-medium text-muted">
              {label}
            </div>
          ))}
          {rows.map((row) => (
            <Row key={row.pads} row={row} />
          ))}
        </div>

        <div className="mt-8 grid gap-3 md:hidden">
          {rows.map((row) => (
            <section
              key={row.pads}
              className={
                row.here
                  ? "grid gap-3 rounded-sm border border-line bg-surface p-4"
                  : "grid gap-3 rounded-sm border border-line p-4"
              }
            >
              <h2 className={row.here ? "font-display text-xl" : "font-medium"}>{row.pads}</h2>
              <Cell label="Machine" value={row.machine} />
              <Cell label="Quote" value={row.quote} />
              <Cell label="When it trades" value={row.when} />
            </section>
          ))}
        </div>

        <div className="mt-12 grid max-w-2xl gap-10">
          <Block title="Same job, different quote">
            <p>
              Clanker and Stockereum do the same thing. One billion tokens go into one Uniswap v4
              position. The creator deposits no quote. The opening price is written at launch. There
              is no function that pulls the liquidity.
            </p>
            <p>
              Clanker cuts the sniper with an auction of about 22 seconds. Stockereum holds the fee
              at 99% for the first 20 seconds. Both of those are hooks. iLAND has neither yet, so
              the pad stays closed. Without one, the first block belongs to bots.
            </p>
            <p>
              On those two pads, part of the pool fee is paid to the creator. iLAND’s factory does
              not. The 1% accrues to the locked position, and the locker cannot collect it.
            </p>
          </Block>

          <Block title="Not the curve">
            <p>
              Trench is a virtual curve. Graduation opens a second pool. Two markets, two prices. A
              STRK pair would be born only after the curve filled. That was already rejected. iLAND
              does not copy it.
            </p>
            <p>
              The machine is Clanker’s. The quote idea is Stockereum’s. The difference is the
              asset: only STRK on Ethereum.
            </p>
          </Block>

          <Block title="The list will not know us on day one">
            <p>
              The trench’s quote chips are ETH, WETH, USDT, USDC, VIRTUAL, USD1, and RWA. There is
              no STRK chip, so a STRK pair falls under Others. GMGN adds launchpads by hand. A fresh
              factory is not in that filter the night it deploys. Volume comes first.
            </p>
          </Block>

          <Block title="Where the name comes from">
            <p>
              Eli Ben-Sasson and Nathan Jeffay’s book,{" "}
              <span className="text-fg">Zero Knowledge, Infinite Trust</span>, closes on a chapter
              called The Integrity Web. Before that, the book uses a thought experiment, a land, to
              make integrity concrete. iLAND takes the picture. It does not take the book’s name,
              and it is not a StarkWare product.
            </p>
            <p className="flex flex-wrap gap-x-5 gap-y-2">
              <a
                href="https://blockchainthebook.com/#about"
                target="_blank"
                rel="noreferrer"
                className="text-fg underline-offset-4 hover:underline"
              >
                About the book
              </a>
              <a
                href="https://blockchainthebook.com/#chapters"
                target="_blank"
                rel="noreferrer"
                className="text-fg underline-offset-4 hover:underline"
              >
                Chapters
              </a>
            </p>
          </Block>
        </div>
      </article>
    </SiteShell>
  );
}

function Row({ row }: { row: (typeof rows)[number] }) {
  const cell = row.here ? "bg-surface px-4 py-4 text-sm" : "bg-bg px-4 py-4 text-sm text-muted";
  return (
    <>
      <div className={row.here ? "bg-surface px-4 py-4 font-display text-lg text-fg" : "bg-bg px-4 py-4 text-sm text-fg"}>
        {row.pads}
      </div>
      <div className={cell}>{row.machine}</div>
      <div className={cell}>{row.quote}</div>
      <div className={cell}>{row.when}</div>
    </>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-subtle">{label}. </span>
      <span className="text-muted">{value}</span>
    </p>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-line pt-8">
      <h2 className="font-display text-title">{title}</h2>
      <div className="grid gap-3 text-pretty text-muted">{children}</div>
    </section>
  );
}
