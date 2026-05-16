"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function RetryOptimizationChart({
  data,
}: {
  data: { cycle: string; reward: number; successLift: number }[];
}) {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -16, right: 12 }}>
          <XAxis dataKey="cycle" stroke="#94a3b8" fontSize={12} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="reward"
            stroke="#a78bfa"
            strokeWidth={2}
          />
          <Line
            type="monotone"
            dataKey="successLift"
            stroke="#34d399"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
