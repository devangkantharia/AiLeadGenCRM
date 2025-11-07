// Location: /components/crm/DealsByStageChart.tsx
// --- NEW FILE ---
// This is a client component for the Pie Chart
"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Flex, Box, Heading, Text, useThemeContext } from "@radix-ui/themes";
import { CHART_COLORS, getStageHexColor } from "@/lib/stageColors";

// Define the shape of a single deal
interface Deal {
  id: string;
  name: string;
  stage: string;
  company: { name: string } | null;
}

// Data we expect: [{ name: 'Discovery', count: 5 }, { name: 'Proposal', count: 2 }, ...]
export function DealsByStageChart({
  data,
  allDeals,
}: {
  data: { name: string; count: number }[];
  allDeals: Deal[];
}) {
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const handleMouseEnter = (data: any) => {
    setHoveredStage(data.name);
  };

  const handleMouseLeave = () => {
    setHoveredStage(null);
  };

  // Handle click/tap for mobile and tablet
  const handleClick = (data: any) => {
    setSelectedStage(selectedStage === data.name ? null : data.name);
  };

  // Use selected stage on mobile/tablet, hovered stage on desktop
  const activeStage = selectedStage || hoveredStage;

  const dealsForActiveStage = activeStage
    ? allDeals.filter((deal) => deal.stage === activeStage)
    : [];

  return (
    <Flex direction={{ initial: 'column', xl: 'row' }} align="start" gap="4">
      <Box className="w-full xl:w-3/4 2xl:w-2/3" style={{ margin: '0 auto', height: '300px', minHeight: '250px' }}>
        <div style={{ width: '100%', height: '100%', margin: '0 auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                isAnimationActive={false}
                data={data}
                cx="50%"
                cy="50%"
                outerRadius="65%"
                fill="#000"
                dataKey="count"
                nameKey="name"
                labelLine={false}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  name,
                  count,
                  index,
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = outerRadius + 10; // Reduced from default ~25-30
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const color = CHART_COLORS[index % CHART_COLORS.length];
                  return (
                    <text
                      x={x}
                      y={y}
                      fill={color}
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                      style={{ fontSize: '12px', fontWeight: '500' }}
                    >
                      {`${name}: ${count}`}
                    </text>
                  );
                }}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleClick}
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                {data.map((entry, index) => (
                  <Cell
                    className={`${isDarkMode ? 'opacity-50' : 'opacity-70'}`}
                    key={`cell-${index}`}
                    fill={CHART_COLORS[index % CHART_COLORS.length]}
                    style={{ outline: 'none' }}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Box>
      <Box className="w-full 2xl:w-1/3">
        {activeStage && dealsForActiveStage.length > 0 && (
          <Box className="pt-4 xl:pt-8">
            <Heading as="h3" size="3" mb="2" style={{ color: getStageHexColor(activeStage) }}>
              {activeStage} Deals
            </Heading>
            <ol style={{ listStyle: 'decimal', paddingLeft: '20px' }}>
              {dealsForActiveStage.map((deal) => (
                <li style={{ color: getStageHexColor(activeStage) }} key={deal.id}>
                  <Text size="2" className="break-words">{deal.name} ({deal.company?.name || "No Company"})</Text>
                </li>
              ))}
            </ol>
          </Box>
        )}
      </Box>
    </Flex>
  );
}