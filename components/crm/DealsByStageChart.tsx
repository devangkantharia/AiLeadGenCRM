// Location: /components/crm/DealsByStageChart.tsx
// --- NEW FILE ---
// This is a client component for the Pie Chart
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"; import { Flex, Box, Heading, Text } from "@radix-ui/themes";

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
    <Flex align="start" gap="4">
      <Box width="66.66%">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              nameKey="name"
              labelLine={false}
              label={({ name, count }) => `${name}: ${count}`}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box width="33.33%">
        {hoveredStage && dealsForHoveredStage.length > 0 && (
          <Box>
            <Heading as="h3" size="3" mb="2">{hoveredStage} Deals</Heading>
            <ol style={{ listStyle: 'decimal', paddingLeft: '20px' }}>
              {dealsForHoveredStage.map((deal) => (
                <li key={deal.id}><Text size="2" >{deal.name} ({deal.company?.name || "No Company"})</Text></li>
              ))}
            </ol>
          </Box>
        )}
      </Box>
    </Flex>
  );
}