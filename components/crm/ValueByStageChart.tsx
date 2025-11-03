// Location: /components/crm/ValueByStageChart.tsx
// --- NEW FILE ---
// This is a client component for the Bar Chart

"use client";

import { useThemeContext } from "@radix-ui/themes";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";



// Helper to format the Y-axis and Tooltip
const formatCurrency = (value: number) => {
  if (value === 0) return "$0";
  if (value < 1000) return `$${value}`;
  return `$${(value / 1000).toFixed(0)}k`;
};

// Data we expect: [{ name: 'Discovery', value: 50000 }, { name: 'Proposal', value: 250000 }, ...]
export function ValueByStageChart({ data }: { data: { name: string, value: number }[] }) {
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" fontSize={12} />
        <YAxis tickFormatter={formatCurrency} fontSize={12} />
        <Tooltip
          formatter={(value: number) =>
            new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
        <Legend />
        <Bar dataKey="value" fill={`var(--${currentAccentColor}-10)`} />
      </BarChart>
    </ResponsiveContainer>
  );
}