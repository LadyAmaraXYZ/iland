import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { STRK } from "./constants.ts";
import { createAddress, toChecksum } from "./address.ts";
import { buildQuote, getSqrtRatioAtTick, spendRatio, tickForMcap } from "./math.ts";

describe("iLAND desk math", () => {
  it("matches the Uniswap square root at tick 0", () => {
    assert.equal(getSqrtRatioAtTick(0), 2n ** 96n);
  });

  it("checksums the Ethereum STRK contract", () => {
    assert.equal(toChecksum(STRK), STRK);
  });

  it("matches a known CREATE address", () => {
    assert.equal(
      createAddress("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0", 1),
      "0x343c43a37d37dff08ae8c4a11544c718abb4fcf8",
    );
  });

  it("opens a 1,000 STRK market near that displayed value", () => {
    const target = 1_000n * 10n ** 18n;
    const { tick } = tickForMcap(target, true);
    const quote = buildQuote(tick, true);
    assert.ok(quote);
    const drift = Number(quote.mcapRaw > target ? quote.mcapRaw - target : target - quote.mcapRaw);
    assert.ok(drift / Number(target) < 0.02, `tick ${tick} drifted`);
  });

  it("costs about 41% of displayed value to double a wide range", () => {
    const quote = buildQuote(-200_000, true);
    assert.ok(quote);
    assert.equal(quote.liquidityFits, true);
    const spend = spendRatio(quote, 2n, 1n);
    assert.equal(spend.capped, false);
    const bps = Number((spend.raw * 10_000n) / quote.mcapRaw);
    assert.ok(bps > 4140 && bps < 4300, `bps ${bps}`);
  });
});
