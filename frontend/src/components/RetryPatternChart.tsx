"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function RetryPatternChart({
  data,
}: {
  data: { pattern: string; count: number }[];
}) {
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 12 }}>
          <XAxis type="number" stroke="#94a3b8" fontSize={12} />
          <YAxis
            dataKey="pattern"
            type="category"
            stroke="#94a3b8"
            fontSize={11}
            width={160}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148,163,184,0.2)",
              borderRadius: 12,
            }}
          />
          <Bar dataKey="count" fill="#60a5fa" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
