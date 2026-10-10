import {
  FEE_DENOM,
  MAX_TICK,
  MAX_U128,
  MIN_TICK,
  Q192,
  Q96,
  SPACING,
  SUPPLY,
} from "./constants.ts";

const TICK_MAX = 887272;

export type Side = "below" | "above";

export type DeskQuote = {
  tokenIs0: boolean;
  startTick: number;
  tickLower: number;
  tickUpper: number;
  sqrtLower: bigint;
  sqrtUpper: bigint;
  sqrtPrice: bigint;
  liquidity: bigint;
  liquidityFits: boolean;
  mcapRaw: bigint;
};

export type Spend = {
  raw: bigint;
  buyerRaw: bigint;
  multiple: number;
  capped: boolean;
};

export function getSqrtRatioAtTick(tick: number): bigint {
  const absTick = tick < 0 ? -tick : tick;
  if (absTick > TICK_MAX) throw new Error("tick");

  let ratio =
    (absTick & 0x1) !== 0
      ? 0xfffcb933bd6fad37aa2d162d1a594001n
      : 0x100000000000000000000000000000000n;
  if ((absTick & 0x2) !== 0) ratio = (ratio * 0xfff97272373d413259a46990580e213an) >> 128n;
  if ((absTick & 0x4) !== 0) ratio = (ratio * 0xfff2e50f5f656932ef12357cf3c7fdccn) >> 128n;
  if ((absTick & 0x8) !== 0) ratio = (ratio * 0xffe5caca7e10e4e61c3624eaa0941cd0n) >> 128n;
  if ((absTick & 0x10) !== 0) ratio = (ratio * 0xffcb9843d60f6159c9db58835c926644n) >> 128n;
  if ((absTick & 0x20) !== 0) ratio = (ratio * 0xff973b41fa98c081472e6896dfb254c0n) >> 128n;
  if ((absTick & 0x40) !== 0) ratio = (ratio * 0xff2ea16466c96a3843ec78b326b52861n) >> 128n;
  if ((absTick & 0x80) !== 0) ratio = (ratio * 0xfe5dee046a99a2a811c461f1969c3053n) >> 128n;
  if ((absTick & 0x100) !== 0) ratio = (ratio * 0xfcbe86c7900a88aedcffc83b479aa3a4n) >> 128n;
  if ((absTick & 0x200) !== 0) ratio = (ratio * 0xf987a7253ac413176f2b074cf7815e54n) >> 128n;
  if ((absTick & 0x400) !== 0) ratio = (ratio * 0xf3392b0822b70005940c7a398e4b70f3n) >> 128n;
  if ((absTick & 0x800) !== 0) ratio = (ratio * 0xe7159475a2c29b7443b29c7fa6e889d9n) >> 128n;
  if ((absTick & 0x1000) !== 0) ratio = (ratio * 0xd097f3bdfd2022b8845ad8f792aa5825n) >> 128n;
  if ((absTick & 0x2000) !== 0) ratio = (ratio * 0xa9f746462d870fdf8a65dc1f90e061e5n) >> 128n;
  if ((absTick & 0x4000) !== 0) ratio = (ratio * 0x70d869a156d2a1b890bb3df62baf32f7n) >> 128n;
  if ((absTick & 0x8000) !== 0) ratio = (ratio * 0x31be135f97d08fd981231505542fcfa6n) >> 128n;
  if ((absTick & 0x10000) !== 0) ratio = (ratio * 0x9aa508b5b7a84e1c677de54f3e99bc9n) >> 128n;
  if ((absTick & 0x20000) !== 0) ratio = (ratio * 0x5d6af8dedb81196699c329225ee604n) >> 128n;
  if ((absTick & 0x40000) !== 0) ratio = (ratio * 0x2216e584f5fa1ea926041bedfe98n) >> 128n;
  if ((absTick & 0x80000) !== 0) ratio = (ratio * 0x48a170391f7dc42444e8fa2n) >> 128n;
  if (tick > 0) ratio = (2n ** 256n - 1n) / ratio;

  const shifted = ratio >> 32n;
  const roundUp = ratio % (1n << 32n) === 0n ? 0n : 1n;
  return shifted + roundUp;
}

function mulDiv(a: bigint, b: bigint, denominator: bigint): bigint {
  return (a * b) / denominator;
}

export function validTick(tick: number): boolean {
  return Number.isInteger(tick) && tick % SPACING === 0 && tick > MIN_TICK && tick < MAX_TICK;
}

export function clampTick(tick: number): number {
  const snapped = Math.round(tick / SPACING) * SPACING;
  if (snapped <= MIN_TICK) return MIN_TICK + SPACING;
  if (snapped >= MAX_TICK) return MAX_TICK - SPACING;
  return snapped;
}

function mcapRawAt(sqrtPrice: bigint, tokenIs0: boolean): bigint {
  const square = sqrtPrice * sqrtPrice;
  if (tokenIs0) return (SUPPLY * square) / Q192;
  return (SUPPLY * Q192) / square;
}

export function buildQuote(startTick: number, tokenIs0: boolean): DeskQuote | null {
  if (!validTick(startTick)) return null;
  const tickLower = tokenIs0 ? startTick : MIN_TICK;
  const tickUpper = tokenIs0 ? MAX_TICK : startTick;
  const sqrtLower = getSqrtRatioAtTick(tickLower);
  const sqrtUpper = getSqrtRatioAtTick(tickUpper);
  if (sqrtUpper <= sqrtLower) return null;
  const sqrtPrice = tokenIs0 ? sqrtLower : sqrtUpper;
  const liquidity = tokenIs0
    ? mulDiv(SUPPLY, mulDiv(sqrtLower, sqrtUpper, Q96), sqrtUpper - sqrtLower)
    : mulDiv(SUPPLY, Q96, sqrtUpper - sqrtLower);
  return {
    tokenIs0,
    startTick,
    tickLower,
    tickUpper,
    sqrtLower,
    sqrtUpper,
    sqrtPrice,
    liquidity,
    liquidityFits: liquidity > 0n && liquidity <= MAX_U128,
    mcapRaw: mcapRawAt(sqrtPrice, tokenIs0),
  };
}

function human(raw: bigint): number {
  const base = 10n ** 18n;
  return Number(raw / base) + Number(raw % base) / 1e18;
}

export function tickForMcap(targetRaw: bigint, tokenIs0: boolean): { tick: number; clamped: boolean } {
  const targetHuman = human(targetRaw);
  const price = targetHuman / 1e9;
  const logTick = Math.log(price) / Math.log(1.0001);
  const ideal = tokenIs0 ? logTick : -logTick;
  const clamped = !Number.isFinite(ideal) || ideal <= MIN_TICK || ideal >= MAX_TICK;
  const center = Number.isFinite(ideal) ? clampTick(ideal) : tokenIs0 ? MIN_TICK + SPACING : MAX_TICK - SPACING;
  let best = center;
  let bestDist = Number.POSITIVE_INFINITY;
  for (let step = -2; step <= 2; step += 1) {
    const tick = center + step * SPACING;
    if (!validTick(tick)) continue;
    const mcap = mcapRawAt(getSqrtRatioAtTick(tick), tokenIs0);
    const value = human(mcap);
    const dist =
      value > 0 && targetHuman > 0
        ? Math.abs(Math.log(value) - Math.log(targetHuman))
        : Number.POSITIVE_INFINITY;
    if (dist < bestDist) {
      bestDist = dist;
      best = tick;
    }
  }
  return { tick: best, clamped };
}

function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = n;
  let y = (x + 1n) / 2n;
  while (y < x) {
    x = y;
    y = (x + n / x) / 2n;
  }
  return x;
}

function isqrtNearest(n: bigint): bigint {
  if (n < 0n) return 0n;
  const root = isqrt(n);
  const next = root + 1n;
  if (next * next - n < n - root * root) return next;
  return root;
}

function squareRatio(hi: bigint, lo: bigint): number {
  if (lo <= 0n) return Number.POSITIVE_INFINITY;
  if (hi / lo > 1_000_000_000n) return Number.POSITIVE_INFINITY;
  const scaled = Number((hi * 1_000_000n) / lo) / 1e6;
  return scaled * scaled;
}

function amount0Delta(liquidity: bigint, sqrtA: bigint, sqrtB: bigint): bigint {
  let lower = sqrtA;
  let upper = sqrtB;
  if (lower > upper) {
    lower = sqrtB;
    upper = sqrtA;
  }
  if (lower === 0n || upper === lower) return 0n;
  const numerator1 = liquidity << 96n;
  return mulDiv(numerator1, upper - lower, upper) / lower;
}

export function maxMultiple(quote: DeskQuote): number {
  if (quote.tokenIs0) return squareRatio(quote.sqrtUpper, quote.sqrtPrice);
  return squareRatio(quote.sqrtPrice, quote.sqrtLower);
}

export function spendRatio(quote: DeskQuote, num: bigint, den: bigint): Spend {
  const start = quote.sqrtPrice;
  let target: bigint;
  let capped = false;
  if (quote.tokenIs0) {
    target = isqrtNearest((start * start * num) / den);
    if (target > quote.sqrtUpper) {
      target = quote.sqrtUpper;
      capped = true;
    }
    if (target < start) target = start;
  } else {
    target = isqrtNearest((start * start * den) / num);
    if (target < quote.sqrtLower) {
      target = quote.sqrtLower;
      capped = true;
    }
    if (target > start) target = start;
  }
  const raw = quote.liquidityFits
    ? quote.tokenIs0
      ? mulDiv(quote.liquidity, target > start ? target - start : 0n, Q96)
      : amount0Delta(quote.liquidity, target, start)
    : 0n;
  const buyerRaw = (raw * FEE_DENOM) / (FEE_DENOM - 10_000n);
  const multiple = quote.tokenIs0 ? squareRatio(target, start) : squareRatio(start, target);
  return { raw, buyerRaw, multiple, capped };
}

export type SpendPoint = { multiple: number; percent: number };

export function spendSeries(quote: DeskQuote): SpendPoint[] {
  const max = maxMultiple(quote);
  const end = Math.min(20, Number.isFinite(max) && max > 1.001 ? max * 0.999 : 1.001);
  const steps = 36;
  const points: SpendPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const multiple = 1 + ((end - 1) * i) / steps;
    const num = BigInt(Math.max(1, Math.round(multiple * 1_000_000)));
    const spend = spendRatio(quote, num, 1_000_000n);
    const percent = quote.mcapRaw === 0n ? 0 : Number((spend.raw * 10_000n) / quote.mcapRaw) / 100;
    points.push({ multiple, percent });
    if (spend.capped) break;
  }
  return points;
}
