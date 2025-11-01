// Location: /components/crm/DealsByStageChart.tsx
// --- NEW FILE ---
// This is a client component for the Pie Chart
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Define the shape of a single deal
interface Deal {
  id: string;
  name: string;
  stage: string;
  company: { name: string } | null;
}

// Define some nice colors for our chart
const COLORS = [
  "#0088FE", // Discovery (Blue)
  "#FFBB28", // Proposal (Yellow)
  "#8884d8", // Negotiation (Purple)
  "#00C49F", // Won (Green)
  "#FF8042", // Lost (Red)
];

// Data we expect: [{ name: 'Discovery', count: 5 }, { name: 'Proposal', count: 2 }, ...]
export function DealsByStageChart({
  data,
  allDeals,
}: {
  data: { name: string; count: number }[];
  allDeals: Deal[];
}) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  const handleMouseEnter = (data: any) => {
    setHoveredStage(data.name);
  };

  const handleMouseLeave = () => {
    setHoveredStage(null);
  };

  const dealsForHoveredStage = hoveredStage
    ? allDeals.filter((deal) => deal.stage === hoveredStage)
    : [];

  return (
    <div className="flex items-start">
      <div className="w-2/3">
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
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="w-1/3 pl-4">
        {hoveredStage && dealsForHoveredStage.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-700">{hoveredStage} Deals</h3>
            <ol className="mt-2 space-y-2 text-sm text-gray-600 list-decimal list-outside pl-5">
              {dealsForHoveredStage.map((deal) => (
                <li key={deal.id}>
                  {deal.name} ({deal.company?.name || "No Company"})
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}