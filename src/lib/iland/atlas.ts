export type AtlasParcel = {
  name: string;
  symbol: string;
  image: string;
  opening: string;
  note: string;
};

export const atlas: AtlasParcel[] = [
  {
    name: "North plat",
    symbol: "NORTH",
    image: "/land/parcel-north.jpg",
    opening: "1,000 STRK",
    note: "A wide range. Doubling still costs about 41% of the displayed cap.",
  },
  {
    name: "Cut field",
    symbol: "CUT",
    image: "/land/parcel-cut.jpg",
    opening: "10,000 STRK",
    note: "Same machine. The quote does not change. Only STRK.",
  },
  {
    name: "Seal",
    symbol: "SEAL",
    image: "/land/parcel-seal.jpg",
    opening: "100,000 STRK",
    note: "The picture is a desk target, not a pool that exists.",
  },
  {
    name: "Terrace",
    symbol: "TERR",
    image: "/land/parcel-terrace.jpg",
    opening: "1,000,000 STRK",
    note: "A tighter story still starts one-sided, with zero STRK inside.",
  },
];
