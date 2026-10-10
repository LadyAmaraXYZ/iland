import { Link } from "@tanstack/react-router";
import { Coins, LayoutGrid, Plus, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { POOL_MANAGER, POOL_MANAGER_URL, STRK, STRK_URL } from "@/lib/iland/constants";

const navLink =
  "inline-flex h-11 items-center gap-2 px-3 text-sm font-medium text-muted transition-colors duration-quick data-[status=active]:text-fg";

const tabLink =
  "flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted data-[status=active]:text-fg";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="" width={28} height={28} className="size-7" />
            <span className="font-display text-xl tracking-tight">iLAND</span>
          </Link>
          <nav className="hidden items-center md:flex">
            <Link to="/" activeOptions={{ exact: true }} className={navLink}>
              <LayoutGrid className="size-4" />
              Board
            </Link>
            <Link to="/tokens" className={navLink}>
              <Coins className="size-4" />
              Tokens
            </Link>
            <Link to="/profile" className={navLink}>
              <UserRound className="size-4" />
              Profile
            </Link>
            <Link to="/place" className={navLink}>
              Field
            </Link>
            <Link to="/mechanism" className={navLink}>
              Rules
            </Link>
          </nav>
          <Link
            to="/create"
            className="inline-flex h-11 items-center gap-2 rounded-sm bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            <Plus className="size-4" />
            Create
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 md:px-8 md:pt-10">{children}</main>
      <footer className="border-t border-line">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 md:grid-cols-2 md:px-8">
          <p className="max-w-sm text-sm text-pretty text-muted">
            Launches stay closed to the public. The hook is deployed. The pictures on the board are not markets.
          </p>
          <dl className="grid gap-4 text-sm">
            <AddressRow label="STRK" value={STRK} href={STRK_URL} />
            <AddressRow label="Uniswap v4 PoolManager" value={POOL_MANAGER} href={POOL_MANAGER_URL} />
          </dl>
        </div>
      </footer>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid h-16 grid-cols-4 border-t border-line bg-bg md:hidden">
        <Link to="/" activeOptions={{ exact: true }} className={tabLink}>
          <LayoutGrid className="size-5" />
          Board
        </Link>
        <Link to="/create" className={tabLink}>
          <Plus className="size-5" />
          Create
        </Link>
        <Link to="/tokens" className={tabLink}>
          <Coins className="size-5" />
          Tokens
        </Link>
        <Link to="/profile" className={tabLink}>
          <UserRound className="size-5" />
          Profile
        </Link>
      </nav>
    </div>
  );
}

function AddressRow({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-1 flex flex-wrap items-start gap-x-3 gap-y-1">
        <span className="break-all font-mono text-xs leading-5">{value}</span>
        <a href={href} target="_blank" rel="noreferrer" className="text-fg underline-offset-4 hover:underline">
          View
        </a>
      </dd>
    </div>
  );
}
