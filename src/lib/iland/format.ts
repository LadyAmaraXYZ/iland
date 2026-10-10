const BASE = 10n ** 18n;

export function parseHumanToRaw(input: string): bigint | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  if (/^0+(?:\.0+)?$/.test(trimmed)) return null;
  const [whole, frac = ""] = trimmed.split(".");
  if ((whole ?? "").length > 24 || frac.length > 18) return null;
  const fraction = `${frac}${"0".repeat(18)}`.slice(0, 18);
  return BigInt(whole) * BASE + BigInt(fraction);
}

export function parseLoose(input: string): number | null {
  const trimmed = input.trim().replace(/,/g, "");
  if (!/^\d+(\.\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!(value > 0) || !Number.isFinite(value)) return null;
  return value;
}

function group(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function formatRawDecimal(raw: bigint, decimals = 18, maxFrac = 4): string {
  if (raw < 0n) return `-${formatRawDecimal(-raw, decimals, maxFrac)}`;
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const frac = raw % base;
  const wholeText = group(whole.toString());
  if (frac === 0n) return wholeText;

  const digits = frac.toString();
  const lead = decimals - digits.length;
  if (whole === 0n && lead >= 6) {
    const sig = digits.slice(0, 4);
    const shown = sig.length > 1 ? `${sig[0]}.${sig.slice(1)}` : sig;
    return `${shown}e-${lead + 1}`;
  }

  const padded = digits.padStart(decimals, "0");
  const keep = whole === 0n ? lead + Math.min(4, digits.length) : maxFrac;
  const fraction = padded.slice(0, keep).replace(/0+$/, "");
  return fraction ? `${wholeText}.${fraction}` : wholeText;
}

export function formatStrk(raw: bigint): string {
  const whole = raw < 0n ? -raw / 10n ** 18n : raw / 10n ** 18n;
  const digits = whole.toString();
  if (digits.length > 12) {
    const exp = digits.length - 1;
    const sig = digits.slice(0, 4);
    const shown = `${sig[0]}.${sig.slice(1)}`;
    return `${raw < 0n ? "-" : ""}${shown}e${exp}`;
  }
  return formatRawDecimal(raw, 18, 2);
}

export function formatPrice(mcapRaw: bigint): string {
  const scaled = mcapRaw / 1_000_000_000n;
  return formatRawDecimal(scaled, 18, 8);
}

export function formatPercent(part: bigint, whole: bigint): string {
  if (whole <= 0n) return "—";
  const bps = (part * 10_000n + whole / 2n) / whole;
  const wholePct = bps / 100n;
  const frac = (bps % 100n).toString().padStart(2, "0");
  return `${wholePct.toString()}.${frac}%`;
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 0 : abs >= 1 ? 2 : 6;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatTick(tick: number): string {
  return tick.toString();
}
