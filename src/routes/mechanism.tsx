import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/site-shell";

export const Route = createFileRoute("/mechanism")({
  head: () => ({
    meta: [{ title: "iLAND — rules" }],
  }),
  component: Rules,
});

function Rules() {
  return (
    <SiteShell>
      <article className="max-w-2xl">
        <p className="text-sm font-medium text-muted">Rules</p>
        <h1 className="mt-3 font-display text-hero">One side, then locked.</h1>
        <p className="mt-4 text-pretty text-lg text-muted">
          The creator does not deposit STRK. Buyers do. The position cannot be withdrawn.
        </p>

        <Section title="What a launch does">
          <ol className="grid gap-4">
            <Item n="01" title="Mint">
              The factory mints 1,000,000,000 tokens, 18 decimals, straight to the locker.
            </Item>
            <Item n="02" title="Place">
              It initializes a Uniswap v4 pool. The only quote is the STRK contract on Ethereum.
              The position runs from your boundary tick to the far end of the usable range, so it
              holds the new token and zero STRK.
            </Item>
            <Item n="03" title="Lock">
              The locker has no withdraw. Neither the creator nor the factory can pull the position.
            </Item>
          </ol>
        </Section>

        <Section title="What the tick means">
          <p>
            <span className="font-mono text-sm">startTick</span> is a multiple of 200, strictly
            inside −887,200 to 887,200. STRK is currency0 or currency1 depending on the token
            address, which is only known when the token is created.
          </p>
          <p>
            If the token address is below STRK, your tick is the floor and the pool opens there. If
            the token address is above STRK, the same number is the ceiling and the pool opens
            there. Those are different prices. The desk can predict the address from the factory
            nonce before you call launch.
          </p>
          <p>
            The locker is created in the factory constructor, so the first token is nonce 2.
          </p>
        </Section>

        <Section title="What the displayed market cap is">
          <p>
            It is the opening price times the whole supply. It is not a balance of STRK. A wide
            one-sided range needs about √2 − 1, roughly 41% of that displayed value in real STRK,
            to double the price. The STRK is paid by buyers. A tighter range costs more, because
            the same tokens sit between closer ticks.
          </p>
          <p>
            The figures on the desk are the STRK that reaches the pool. The buyer line adds the 1%
            pool fee. A router or a protocol fee would add more.
          </p>
        </Section>

        <Section title="What is still closed">
          <p>
            The hook is written and not deployed. For 20 seconds after initialize the pool fee is
            99%. Then it is 1%. During those 20 seconds only the locker may add liquidity, and
            nobody may remove it. Do not open public launches until that hook is the one on the pool.
          </p>
          <p>
            There is no single transaction that buys with ETH. A buy would be ETH, then the
            existing STRK/ETH pool, then this v4 pool.
          </p>
          <p>
            The first launch has to be private. Confirm the pool holds the new token and zero STRK,
            and that the locker cannot withdraw. If rounding asks the locker for even one unit of
            STRK, the launch reverts.
          </p>
          <p>The contracts are not audited.</p>
        </Section>

        <Section title="What this is not">
          <p>
            Not a bonding curve. Not a virtual STRK reserve. Not a second fee tier of an existing
            pair. Not a Starknet application. The pad is not a token, and a token launched here is
            not named iLAND. The other machine, the one that graduates off a curve, is a different
            market.{" "}
            <Link to="/place" className="text-fg underline-offset-4 hover:underline">
              See where this one sits.
            </Link>
          </p>
        </Section>
      </article>
    </SiteShell>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 grid gap-3 border-t border-line pt-8">
      <h2 className="font-display text-title">{title}</h2>
      <div className="grid gap-3 text-pretty text-muted">{children}</div>
    </section>
  );
}

function Item({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <li className="grid grid-cols-[2.5rem_1fr] gap-3">
      <span className="font-mono text-sm text-subtle">{n}</span>
      <span>
        <span className="font-medium text-fg">{title}. </span>
        {children}
      </span>
    </li>
  );
}
