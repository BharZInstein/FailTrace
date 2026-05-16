"use client";

import {
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

export default function ReplayRiskGauge({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const data = [{ name: label, value, fill: value > 70 ? "#60a5fa" : value > 40 ? "#f59e0b" : "#ef4444" }];

  return (
    <div className="flex flex-col items-center">
      <div className="h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="70%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar dataKey="value" cornerRadius={10} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-sm text-slate-300">{label}</p>
      <p className="text-2xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
