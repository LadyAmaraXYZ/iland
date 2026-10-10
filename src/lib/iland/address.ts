import { keccak_256 } from "@noble/hashes/sha3.js";

function concat(...parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeLength(length: number): Uint8Array {
  const hex = length.toString(16);
  const padded = hex.length % 2 === 0 ? hex : `0${hex}`;
  const out = new Uint8Array(padded.length / 2);
  for (let i = 0; i < out.length; i += 1) out[i] = Number.parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function encodeNonce(nonce: number): Uint8Array {
  if (!Number.isInteger(nonce) || nonce < 0) throw new Error("nonce");
  if (nonce === 0) return Uint8Array.of(0x80);
  if (nonce < 0x80) return Uint8Array.of(nonce);
  const body = encodeLength(nonce);
  return concat(Uint8Array.of(0x80 + body.length), body);
}

function rlpList(payload: Uint8Array): Uint8Array {
  if (payload.length < 56) return concat(Uint8Array.of(0xc0 + payload.length), payload);
  const length = encodeLength(payload.length);
  return concat(Uint8Array.of(0xf7 + length.length), length, payload);
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function isAddress(value: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(value.trim());
}

/** CREATE address: keccak256(rlp([deployer, nonce]))[12:] */
export function createAddress(deployer: string, nonce: number): string {
  const hex = deployer.trim().toLowerCase();
  if (!isAddress(hex)) throw new Error("address");
  const raw = new Uint8Array(20);
  for (let i = 0; i < 20; i += 1) raw[i] = Number.parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
  const encoded = rlpList(concat(Uint8Array.of(0x94), raw, encodeNonce(nonce)));
  const hash = keccak_256(encoded);
  return `0x${bytesToHex(hash.slice(12))}`;
}

export function toChecksum(address: string): string {
  const lower = address.toLowerCase().replace(/^0x/, "");
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(lower)));
  let out = "0x";
  for (let i = 0; i < 40; i += 1) {
    out += Number.parseInt(hash[i] ?? "0", 16) >= 8 ? (lower[i] ?? "").toUpperCase() : (lower[i] ?? "");
  }
  return out;
}
