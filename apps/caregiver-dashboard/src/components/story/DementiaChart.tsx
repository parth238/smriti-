import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DEMENTIA_CHART_DATA } from "./storyData";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.[0]) {
    return null;
  }
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-neutral-900">{label}</p>
      <p className="text-neutral-600">{payload[0].value} million people</p>
    </div>
  );
}

export function DementiaChart() {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={[...DEMENTIA_CHART_DATA]} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="dementiaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#171717" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#171717" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e5e5" strokeDasharray="4 4" vertical={false} />
          <XAxis
            dataKey="year"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#737373", fontSize: 12 }}
            tickFormatter={(value: number) => `${value}M`}
            domain={[0, 18]}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#a3a3a3", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="millions"
            stroke="#171717"
            strokeWidth={2}
            fill="url(#dementiaFill)"
            animationDuration={1200}
            animationEasing="ease-out"
            dot={{ r: 3, fill: "#171717", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "#171717" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
