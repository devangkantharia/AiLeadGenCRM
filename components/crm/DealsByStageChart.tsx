// Location: /components/crm/DealsByStageChart.tsx
// --- NEW FILE ---
// This is a client component for the Pie Chart

"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Define some nice colors for our chart
const COLORS = [
  "#0088FE", // Discovery (Blue)
  "#FFBB28", // Proposal (Yellow)
  "#8884d8", // Negotiation (Purple)
  "#00C49F", // Won (Green)
  "#FF8042", // Lost (Red)
];

// Data we expect: [{ name: 'Discovery', count: 5 }, { name: 'Proposal', count: 2 }, ...]
export function DealsByStageChart({ data }: { data: { name: string, count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="count"
          nameKey="name"
          label={(entry) => entry.count} // Show the count on the chart
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}