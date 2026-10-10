import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SpendPoint } from "@/lib/iland/math";

export function SpendChart({ points }: { points: SpendPoint[] }) {
  return (
    <div className="h-56 w-full" role="img" aria-label="STRK spent as a percent of displayed market cap while price rises">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-line)" vertical={false} />
          <XAxis
            dataKey="multiple"
            tickFormatter={(value: number) => `${value.toFixed(value >= 10 ? 0 : 1)}×`}
            stroke="transparent"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => `${Math.round(value)}%`}
            stroke="transparent"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={42}
          />
          <Tooltip
            cursor={{ stroke: "var(--color-line)" }}
            contentStyle={{
              background: "var(--color-elevated)",
              border: "1px solid var(--color-line)",
              borderRadius: 8,
              color: "var(--color-fg)",
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value).toFixed(1)}% of displayed`, "STRK in"]}
            labelFormatter={(label) => `${Number(label).toFixed(2)}× price`}
          />
          <Line
            type="monotone"
            dataKey="percent"
            stroke="var(--color-fg)"
            strokeWidth={1.75}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
