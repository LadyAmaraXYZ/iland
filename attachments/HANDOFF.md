# iLAND handoff

Continue from this file. Do not reopen settled decisions unless the user changes them.

## What this is

iLAND is an Ethereum launchpad. Every token it creates is paired only with STRK. The market is a one-sided Uniswap v4 position. The creator does not deposit STRK. Buyers do.

It is not Starknet. It is not StarkWare. It is not the STRK token. It is not a bonding curve.

Brand: **iLAND**
Domain: **iland.lol** (bought 10 Oct 2026, not pointed at a site yet)
Do not use the name Starkland. Do not name the first launched token iLAND. The pad and a token must not share the name.

The phrase behind it is Eli Ben-Sasson's "Integrity Web" / IntegrityLand, from *Zero Knowledge, Infinite Trust* and his 26 Dec 2023 post. That is the source, not the public name.

## Mechanism

Same family as Clanker and Stockereum. Not the same family as Trench.

1. Factory mints 1,000,000,000 tokens, 18 decimals, to a locker.
2. It initializes a Uniswap v4 pool. Quote is only the Ethereum STRK contract.
3. The position runs from the opening tick to the far end of the range, so the position holds only the new token. STRK in the pool is zero until someone buys.
4. Fee is 1% (10000). Tick spacing is 200. The usable range is tick -887200 to 887200.
5. The locker has no withdraw. The position cannot be pulled by the creator or the factory.
6. There is no hook yet. `hooks` is `address(0)`.

Displayed market cap is opening price times supply. It is not STRK sitting in the pool. Doubling the price costs about 41% of that displayed value in real STRK, paid by buyers.

A full-range v3 pool cannot do this. Full range requires both tokens. That is why bunker STRK showed about $180: 2,500 STRK was actually deposited against the whole supply.

## What is not built

- No anti-snipe. Stockereum uses a fee that starts at 99% and decays over 20 seconds. Clanker uses an auction of about 22 seconds. Without one of those, the first block belongs to bots. Do not deploy the pad publicly until a hook does this.
- No router that swaps ETH to STRK to the new token in one transaction.
- No site on iland.lol.
- No GMGN listing. GMGN adds launchpads by hand. A fresh factory will not appear in their filter on day one. Their quote chips are ETH, WETH, USDT, USDC, VIRTUAL, USD1, RWA, OTHERS. There is no STRK chip.
- Not audited.

## Code

`iland/ILandFactory.sol`

Compiled with solc 0.8.26, optimizer 200 runs. Not deployed.

- `ILandFactory` is 9808 bytes.
- Launches are owner-only until `setPublicLaunches(true)`.
- Owner is whoever deploys. Deploy only from the wallet below.
- STRK is immutable: `0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766`
- PoolManager is immutable: `0x000000000004444c5dc75cB358380D2e3dE08A90`

`launch(name, symbol, startTick)` — `startTick` must be a multiple of 200 and strictly inside -887200..887200. If the token address is below STRK, that tick is the floor. If it is above STRK, that tick is the ceiling.

## Wallet

Deployer: `0x6A41695dfF6a581390e115199Ef4322FC831B208`

Checked 10 Oct 2026, about 00:10 UTC+3: 0 ETH, nonce 0.

Send **0.2 ETH** before any deploy. STRK is not required in this wallet. Gas that night was about 0.1 gwei, so the deploy itself is cheap. 0.2 ETH is the buffer if gas rises toward 40 gwei.

Do not fund it from the bunker wallet if the two projects should stay unlinked. Do not paste a private key into chat.

## Bunker is paused

Do not continue bunker inside iLAND.

- Token bunker STRK, `0x08F50Aa5A2200A32427E3Eb78bd127A979952Ff6`
- Pool BUNKER/STRK v3 1% full range, `0x0d1b30a63d7eb499181a8947f9a6b6be3df1db9e`
- Position NFT `1381378` was still in `0xD9e13237317aD7B20E68A2C8B4ef475EfBFfE990`, not in the lock `0xCAEBCa71b8c0d0e2bD8035FAE7A95289984Fa4e7`
- Site: bunkerstrk.xyz. Do not overwrite it with iLAND.

## Next session

1. Confirm the new wallet holds about 0.2 ETH.
2. Add the anti-snipe hook and mine its CREATE2 address so the permission bits match. Then point the pool at that hook. A hook bug either bricks the pool or lets liquidity move.
3. Deploy the factory from the new wallet only after that hook is in the same transaction path. Remix, compiler 0.8.26, optimizer on.
4. One private test launch. Confirm the pool holds the new token and zero STRK, and that the locker cannot withdraw.
5. Build the site on iland.lol. English on the site. The user talks Turkish in chat.
6. A buy route: ETH, then the existing STRK/ETH pool, then the new v4 pool.
7. Ask GMGN for a launchpad filter only after real launches exist.

## Rejected

- Virtual reserves. Uniswap does not have a pretend-STRK balance. Stockereum's empty quote side is a one-sided range, not a virtual reserve.
- A second fee tier of an existing pair. Arbitrage closes it.
- Robinhood in v1. This STRK contract is not on that chain.
- Copying an unaudited hook and deploying it the same night.
