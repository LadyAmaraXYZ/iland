export const SUPPLY_WHOLE = 1_000_000_000n;
export const SUPPLY = SUPPLY_WHOLE * 10n ** 18n;
export const Q96 = 2n ** 96n;
export const Q192 = Q96 * Q96;
export const FEE = 10_000;
export const FEE_DENOM = 1_000_000n;
export const SPACING = 200;
export const MIN_TICK = -887_200;
export const MAX_TICK = 887_200;
export const MAX_U128 = (1n << 128n) - 1n;

export const STRK = "0xCa14007Eff0dB1f8135f4C25B34De49AB0d42766";
export const POOL_MANAGER = "0x000000000004444c5dc75cB358380D2e3dE08A90";

export const STRK_URL = `https://etherscan.io/token/${STRK}`;
export const POOL_MANAGER_URL = `https://etherscan.io/address/${POOL_MANAGER}`;

export const FACTORY = "0x2970967dDd50Eb323e185F98148Ab396E21eae1E";
export const FACTORY_URL = `https://etherscan.io/address/${FACTORY}`;
