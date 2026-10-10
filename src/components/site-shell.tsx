import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { POOL_MANAGER, POOL_MANAGER_URL, STRK, STRK_URL } from "@/lib/iland/constants";

const navLink =
  "inline-flex h-11 items-center px-3 text-sm font-medium text-muted transition-colors duration-quick data-[status=active]:text-fg";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-bg">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" width={28} height={28} className="size-7" />
            <span className="font-display text-xl tracking-tight">iLAND</span>
          </Link>
          <nav className="flex items-center">
            <Link to="/" hash="desk" activeOptions={{ exact: true }} className={navLink}>
              Desk
            </Link>
            <Link to="/place" className={navLink}>
              Field
            </Link>
            <Link to="/mechanism" className={navLink}>
              Rules
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8 md:pt-10">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 md:grid-cols-2 md:px-8">
          <div>
            <p className="font-display text-xl">iLAND</p>
            <p className="mt-2 max-w-sm text-sm text-pretty text-muted">
              An Ethereum launchpad. Every token is paired only with STRK. Not a bonding curve,
              not a Starknet app, and not audited.
            </p>
            <p className="mt-4 text-sm text-subtle">iland.lol</p>
          </div>
          <dl className="grid gap-4 text-sm">
            <AddressRow label="STRK" value={STRK} href={STRK_URL} />
            <AddressRow label="Uniswap v4 PoolManager" value={POOL_MANAGER} href={POOL_MANAGER_URL} />
          </dl>
        </div>
      </footer>
    </div>
  );
}

function AddressRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-start gap-x-3 gap-y-1">
        <span className="break-all font-mono text-xs leading-5">{value}</span>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="text-fg underline-offset-4 hover:underline"
        >
          View
        </a>
      </dd>
    </div>
  );
}
