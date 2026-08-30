import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TrendPoint } from "../../data/demo";

type TrendChartProps = {
  data: TrendPoint[];
  dataKey: "accuracy" | "reactionMs";
  baseline: number;
};

export function TrendChart({ data, dataKey, baseline }: TrendChartProps) {
  const color = dataKey === "accuracy" ? "#4B6E58" : "#A8342A";
  const chartData = data.map((point) => ({ ...point, baseline }));
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#7C93A3" strokeOpacity={0.2} />
          <XAxis dataKey="day" stroke="#7C93A3" />
          <YAxis stroke="#7C93A3" />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} />
          <Line
            type="monotone"
            dataKey="baseline"
            stroke="#7C93A3"
            strokeDasharray="6 6"
            dot={false}
            name="Their usual week"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
