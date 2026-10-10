import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { POOL_MANAGER, POOL_MANAGER_URL, STRK, STRK_URL } from "@/lib/iland/constants";

const navLink =
  "inline-flex h-11 items-center px-2.5 font-mono text-xs tracking-widest text-muted uppercase transition-colors duration-quick data-[status=active]:text-fg";

const tabLink =
  "flex flex-1 flex-col items-center justify-center font-mono text-xs tracking-widest text-muted uppercase data-[status=active]:text-accent";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg pb-16 text-fg md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/" className="font-display text-lg font-extrabold tracking-tight">
            iLAND
          </Link>
          <nav className="hidden items-center md:flex">
            <Link to="/" activeOptions={{ exact: true }} className={navLink}>
              Board
            </Link>
            <Link to="/tokens" className={navLink}>
              Tokens
            </Link>
            <Link to="/place" className={navLink}>
              Field
            </Link>
            <Link to="/mechanism" className={navLink}>
              Rules
            </Link>
            <Link to="/profile" className={navLink}>
              Profile
            </Link>
          </nav>
          <Link
            to="/create"
            className="inline-flex h-10 items-center rounded-md bg-accent px-4 font-mono text-xs tracking-widest text-accent-fg uppercase"
          >
            Create
          </Link>
        </div>
      </header>
      {/* iLAND Robinhood Chain card — paste CA here when ready */}
      <div className="border-b border-line bg-elevated">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-md overflow-hidden">
              <img src="/land/iland-logo.svg" alt="iLAND" className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold">iLAND</p>
              <a
                href="https://robin.etherscan.io/address/0x37705fd86734914387c6eb0a74dbd1b983f81e18"
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs text-accent"
              >
                0x37705fd86734914387c6eb0a74dbd1b983f81e18
              </a>
            </div>
          </div>
          <div className="rounded-sm bg-[#00d084] px-3 py-1 font-mono text-xs font-bold text-black">
            Public launch soon
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 md:grid-cols-2 md:px-6">
          <p className="max-w-sm text-sm text-pretty text-muted">
            One-sided Uniswap v4 pool. Buyers bring the STRK. The position cannot be withdrawn.
          </p>
          <dl className="grid gap-4 text-sm">
            <AddressRow label="STRK" value={STRK} href={STRK_URL} />
            <AddressRow label="PoolManager" value={POOL_MANAGER} href={POOL_MANAGER_URL} />
          </dl>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid h-14 grid-cols-4 border-t border-line bg-bg md:hidden">
        <Link to="/" activeOptions={{ exact: true }} className={tabLink}>
          Board
        </Link>
        <Link to="/create" className={tabLink}>
          Create
        </Link>
        <Link to="/tokens" className={tabLink}>
          Tokens
        </Link>
        <Link to="/mechanism" className={tabLink}>
          Rules
        </Link>
      </nav>
    </div>
  );
}

function AddressRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="grid gap-1">
      <dt className="font-mono text-xs tracking-widest text-subtle uppercase">{label}</dt>
      <dd>
        <a href={href} className="font-mono text-xs break-all text-fg underline-offset-4 hover:underline">
          {value}
        </a>
      </dd>
    </div>
  );
}
