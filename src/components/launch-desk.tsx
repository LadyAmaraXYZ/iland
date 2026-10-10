import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createAddress, isAddress, toChecksum } from "@/lib/iland/address";
import { STRK } from "@/lib/iland/constants";
import {
  formatPercent,
  formatPrice,
  formatStrk,
  formatTick,
  formatUsd,
  parseHumanToRaw,
  parseLoose,
} from "@/lib/iland/format";
import {
  buildQuote,
  spendRatio,
  spendSeries,
  tickForMcap,
  type Side,
  type SpendPoint,
} from "@/lib/iland/math";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "iland-desk-v1";
const STRK_PRESETS = ["100", "1000", "10000", "100000", "1000000"];
const USD_PRESETS = ["1000", "10000", "100000", "1000000"];

type Unit = "strk" | "usd";

type Draft = {
  name: string;
  symbol: string;
  amount: string;
  unit: Unit;
  side: Side;
  predict: boolean;
  factory: string;
  nonce: string;
};

const INITIAL: Draft = {
  name: "",
  symbol: "",
  amount: "1000",
  unit: "strk",
  side: "below",
  predict: false,
  factory: "",
  nonce: "2",
};

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return {
      ...INITIAL,
      ...parsed,
      unit: parsed.unit === "usd" ? "usd" : "strk",
      side: parsed.side === "above" ? "above" : "below",
      predict: Boolean(parsed.predict),
    };
  } catch {
    return null;
  }
}

export function LaunchDesk() {
  const [draft, setDraft] = useState<Draft>(INITIAL);
  const [ready, setReady] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [Chart, setChart] = useState<((props: { points: SpendPoint[] }) => ReactNode) | null>(null);

  useEffect(() => {
    const saved = loadDraft();
    if (saved) setDraft(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft, ready]);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(
      "https://coins.llama.fi/prices/current/ethereum:0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766",
      { signal: controller.signal },
    )
      .then((response) => response.json())
      .then((body: { coins?: Record<string, { price?: number }> }) => {
        const entry = Object.entries(body.coins ?? {}).find(([key]) =>
          key.toLowerCase().includes(STRK.toLowerCase()),
        );
        if (typeof entry?.[1].price === "number") setPrice(entry[1].price);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  useEffect(() => {
    void import("@/components/spend-chart").then((mod) => setChart(() => mod.SpendChart));
  }, []);

  function patch(partial: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setCopied(false);
  }

  const nonce = Number(draft.nonce);
  const nonceValid = Number.isInteger(nonce) && nonce >= 0 && nonce < 1_000_000_000;
  const factoryValid = isAddress(draft.factory);
  const prediction = useMemo(() => {
    if (!draft.predict || !factoryValid || !nonceValid) return null;
    try {
      const address = toChecksum(createAddress(draft.factory, nonce));
      const side: Side = address.toLowerCase() < STRK.toLowerCase() ? "below" : "above";
      return { address, side };
    } catch {
      return null;
    }
  }, [draft.factory, draft.predict, factoryValid, nonce, nonceValid]);

  const side: Side = prediction?.side ?? draft.side;
  const tokenIs0 = side === "below";

  const targetRaw = useMemo(() => {
    if (draft.unit === "strk") return parseHumanToRaw(draft.amount);
    if (price == null) return null;
    const usd = parseLoose(draft.amount);
    if (usd == null) return null;
    return parseHumanToRaw((usd / price).toFixed(8));
  }, [draft.amount, draft.unit, price]);

  const selection = targetRaw != null ? tickForMcap(targetRaw, tokenIs0) : null;
  const quote = selection ? buildQuote(selection.tick, tokenIs0) : null;
  const other = selection ? buildQuote(selection.tick, !tokenIs0) : null;
  const moves = quote
    ? [
        { label: "2×", spend: spendRatio(quote, 2n, 1n) },
        { label: "5×", spend: spendRatio(quote, 5n, 1n) },
        { label: "10×", spend: spendRatio(quote, 10n, 1n) },
      ]
    : [];
  const series = quote?.liquidityFits ? spendSeries(quote) : [];
  const double = moves[0];
  const humanStrk = quote
    ? Number(quote.mcapRaw / 10n ** 18n) + Number(quote.mcapRaw % 10n ** 18n) / 1e18
    : null;
  const usdMcap = humanStrk != null && price != null ? humanStrk * price : null;

  const amountError =
    draft.unit === "usd" && price == null
      ? "STRK’s dollar price has not loaded. Enter the market cap in STRK."
      : targetRaw == null
        ? "Enter a market cap above zero."
        : null;

  async function copyParameters() {
    if (!quote) return;
    const lines = [
      "iLAND worksheet",
      "This page does not send a transaction.",
      `Name: ${draft.name.trim() || "(unset)"}`,
      `Symbol: ${draft.symbol.trim() || "(unset)"}`,
      `Sort: ${tokenIs0 ? "token address below STRK, tick is the floor" : "token address above STRK, tick is the ceiling"}`,
      prediction ? `Predicted token: ${prediction.address}` : "Predicted token: (not set)",
      `startTick: ${quote.startTick}`,
      `Displayed market cap: ${formatStrk(quote.mcapRaw)} STRK`,
      `Opening price: ${formatPrice(quote.mcapRaw)} STRK per token`,
      `Tick range: ${quote.tickLower} to ${quote.tickUpper}`,
      "Fee after 20 seconds: 10000 (1%). First 20 seconds: 990000 (99%).",
      "Tick spacing: 200",
      "Hooks: written, not deployed. Do not launch publicly yet.",
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div id="desk" className="scroll-mt-20">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="font-display text-title">Opening price</h2>
        <p className="text-sm text-muted">Nothing here is deployed.</p>
      </div>
      <div className="grid items-start gap-4 lg:grid-cols-12">
        <Card className="order-2 lg:order-none lg:col-span-5">
          <form
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault();
              void copyParameters();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input
                  value={draft.name}
                  maxLength={64}
                  autoComplete="off"
                  placeholder="North Plot"
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>
              <Field label="Symbol">
                <Input
                  value={draft.symbol}
                  maxLength={16}
                  autoComplete="off"
                  placeholder="PLOT"
                  className="uppercase"
                  onChange={(event) => patch({ symbol: event.target.value })}
                />
              </Field>
            </div>

            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">Displayed market cap</legend>
              <div className="grid grid-cols-2 gap-1 rounded-sm bg-bg p-1" role="radiogroup" aria-label="Unit">
                <Segment
                  pressed={draft.unit === "strk"}
                  onClick={() => patch({ unit: "strk" })}
                  label="STRK"
                />
                <Segment
                  pressed={draft.unit === "usd"}
                  onClick={() => patch({ unit: "usd" })}
                  label="USD"
                />
              </div>
              <Input
                inputMode="decimal"
                value={draft.amount}
                aria-label={draft.unit === "strk" ? "Market cap in STRK" : "Market cap in USD"}
                className="font-mono tabular-nums"
                onChange={(event) => patch({ amount: event.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                {(draft.unit === "strk" ? STRK_PRESETS : USD_PRESETS).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="h-11 rounded-sm border border-line px-3 text-sm text-muted transition-colors duration-quick hover:text-fg"
                    onClick={() => patch({ amount: preset })}
                  >
                    {draft.unit === "strk" ? `${Number(preset).toLocaleString("en-US")} STRK` : `$${Number(preset).toLocaleString("en-US")}`}
                  </button>
                ))}
              </div>
              {amountError ? <p className="text-sm text-muted">{amountError}</p> : null}
            </fieldset>

            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">Which side of STRK</legend>
              <label className="flex items-start gap-3 text-sm leading-5">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={draft.predict}
                  onChange={(event) => patch({ predict: event.target.checked })}
                />
                <span>Predict the token address from the factory nonce, then pick the tick for that sort.</span>
              </label>
              {draft.predict ? (
                <div className="grid gap-3">
                  <Field label="Factory address">
                    <Input
                      value={draft.factory}
                      spellCheck={false}
                      autoComplete="off"
                      placeholder="0x"
                      className="font-mono text-sm"
                      onChange={(event) => patch({ factory: event.target.value.trim() })}
                    />
                  </Field>
                  <Field label="Nonce of this launch">
                    <Input
                      inputMode="numeric"
                      value={draft.nonce}
                      className="font-mono tabular-nums"
                      onChange={(event) => patch({ nonce: event.target.value.replace(/[^\d]/g, "") })}
                    />
                  </Field>
                  <p className="text-sm text-pretty text-muted">
                    The locker is created in the constructor, so the first token uses nonce 2. Each later launch uses the next nonce.
                  </p>
                  {draft.factory.length > 0 && !factoryValid ? (
                    <p className="text-sm text-muted">That is not a 20-byte address.</p>
                  ) : null}
                  {prediction ? (
                    <p className="break-all font-mono text-xs leading-5">
                      {prediction.address} sorts {prediction.side} STRK.
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-1 rounded-sm bg-bg p-1 sm:grid-cols-2" role="radiogroup" aria-label="Address sort">
                <Segment
                  pressed={side === "below"}
                  disabled={prediction != null}
                  onClick={() => patch({ side: "below" })}
                  label="Below STRK"
                />
                <Segment
                  pressed={side === "above"}
                  disabled={prediction != null}
                  onClick={() => patch({ side: "above" })}
                  label="Above STRK"
                />
              </div>
              <p className="text-sm text-pretty text-muted">
                {tokenIs0
                  ? "The token address is lower than STRK, so your tick is the floor. The pool opens there, holding only the new token."
                  : "The token address is higher than STRK, so your tick is the ceiling. The pool opens there, holding only the new token."}
              </p>
            </fieldset>
          </form>
        </Card>

        <Card className="order-1 grid gap-6 lg:order-none lg:col-span-7">
          {quote ? (
            <>
              <div>
                <p className="text-sm text-muted">Displayed market cap</p>
                <p className="mt-1 font-display text-stat tabular-nums" data-testid="mcap">
                  {formatStrk(quote.mcapRaw)} <span className="text-lg text-muted">STRK</span>
                </p>
                <p className="mt-1 text-sm tabular-nums text-muted">
                  {usdMcap != null ? `About ${formatUsd(usdMcap)} at the current STRK price. ` : null}
                  {formatPrice(quote.mcapRaw)} STRK per token.
                </p>
                {selection?.clamped ? (
                  <p className="mt-2 text-sm text-muted">
                    That market cap sits outside the usable tick range. This is the nearest edge.
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-end justify-between gap-3 border-y border-line py-4">
                <div>
                  <p className="text-sm text-muted">startTick</p>
                  <p className="font-mono text-stat tabular-nums" data-testid="start-tick">
                    {formatTick(quote.startTick)}
                  </p>
                  <p className="text-sm text-muted">
                    {tokenIs0 ? "Floor" : "Ceiling"} · {quote.tickLower} to {quote.tickUpper}
                  </p>
                </div>
                <Button type="button" variant="secondary" onClick={() => void copyParameters()}>
                  {copied ? "Copied" : "Copy parameters"}
                </Button>
              </div>

              {!quote.liquidityFits ? (
                <p className="text-sm text-muted">
                  Liquidity does not fit in 128 bits. The factory would revert.
                </p>
              ) : (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {moves.map((move) => (
                      <div key={move.label} className="rounded-sm bg-bg px-3 py-3">
                        <p className="text-sm text-muted">{move.label}</p>
                        {move.spend.capped ? (
                          <>
                            <p className="mt-1 font-medium">Past the far tick</p>
                            <p className="text-sm tabular-nums text-muted">
                              Range ends near {move.spend.multiple.toFixed(2)}×
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="mt-1 font-medium tabular-nums">{formatStrk(move.spend.raw)} STRK</p>
                            <p className="text-sm tabular-nums text-muted">
                              {formatPercent(move.spend.raw, quote.mcapRaw)} of displayed
                            </p>
                            <p className="text-sm tabular-nums text-subtle">
                              Buyer sends {formatStrk(move.spend.buyerRaw)}
                            </p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                  {Chart && series.length > 1 ? <Chart points={series} /> : <div className="h-56 rounded-sm border border-line" />}
                  <p className="text-sm text-pretty text-muted">
                    {double && !double.spend.capped
                      ? `Doubling takes ${formatPercent(double.spend.raw, quote.mcapRaw)} of the displayed market cap in STRK that reaches the pool. On a wide range that sits near 41%. A short range costs more. The buyer line adds the 1% fee charged after the first 20 seconds. During those 20 seconds the hook fee is 99%.`
                      : "This range is too short for a double. Price runs out of tokens before 2×."}
                  </p>
                </>
              )}

              <RangeBar tick={quote.startTick} tokenIs0={tokenIs0} />

              {other ? (
                <div className="rounded-sm border border-line px-4 py-3">
                  <p className="text-sm font-medium">Same tick, other sort</p>
                  <p className="mt-1 text-sm text-pretty text-muted">
                    If the token address sorts the other way, this start tick opens at{" "}
                    <span className="tabular-nums text-fg">{formatStrk(other.mcapRaw)} STRK</span>
                    {other.liquidityFits ? "" : ", and the liquidity would not fit"}. Check the sort before you launch.
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-sm text-muted">Enter a market cap to see the tick.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}

function Segment({
  pressed,
  label,
  onClick,
  disabled = false,
}: {
  pressed: boolean;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={pressed}
      disabled={disabled}
      onClick={onClick}
      className={
        pressed
          ? "h-11 rounded-xs bg-surface text-sm font-medium text-fg disabled:opacity-100"
          : "h-11 rounded-xs text-sm text-muted disabled:opacity-100"
      }
    >
      {label}
    </button>
  );
}

function RangeBar({ tick, tokenIs0 }: { tick: number; tokenIs0: boolean }) {
  const min = -887200;
  const max = 887200;
  const pos = ((tick - min) / (max - min)) * 100;
  const from = tokenIs0 ? pos : 0;
  const width = tokenIs0 ? 100 - pos : pos;
  return (
    <div>
      <div className="relative h-8">
        <div className="absolute top-1/2 h-px w-full bg-line" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 bg-fg"
          style={{ left: `${from}%`, width: `${Math.max(width, 0.4)}%` }}
        />
        <div
          className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="flex justify-between font-mono text-xs text-subtle tabular-nums">
        <span>−887,200</span>
        <span>{tokenIs0 ? "floor" : "ceiling"} {tick}</span>
        <span>887,200</span>
      </div>
    </div>
  );
}
