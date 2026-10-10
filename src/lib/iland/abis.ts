export const factoryAbi = [
  {
    type: "function",
    name: "launch",
    inputs: [
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
    outputs: [{ name: "token", type: "address" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "launchCount",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenAt",
    inputs: [{ name: "index", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Launched",
    inputs: [
      { name: "token", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string" },
      { name: "symbol", type: "string" },
    ],
  },
] as const;

export const tokenAbi = [
  {
    type: "function",
    name: "open",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyWithEth",
    inputs: [{ name: "minGrinta", type: "uint256" }],
    outputs: [{ name: "grintaOut", type: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "opened",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
] as const;
