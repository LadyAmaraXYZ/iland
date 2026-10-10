export type Plot = {
  id: string;
  name: string;
  symbol: string;
  note: string;
  image: string;
  at: number;
};

const KEY = "iland-plots-v1";

export function loadPlots(): Plot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Plot[];
    return Array.isArray(parsed) ? parsed.filter((plot) => plot && plot.name && plot.symbol) : [];
  } catch {
    return [];
  }
}

export function savePlot(plot: Plot) {
  const next = [plot, ...loadPlots().filter((item) => item.id !== plot.id)].slice(0, 12);
  localStorage.setItem(KEY, JSON.stringify(next));
}
