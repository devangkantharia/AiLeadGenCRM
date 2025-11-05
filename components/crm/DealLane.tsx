// Location: /components/crm/DealLane.tsx

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DealCard } from "./DealCard";
import { Box, Heading, Text, useThemeContext } from "@radix-ui/themes";
import { getLaneBackgroundColor, getLaneBorderColor, getStageHexColor } from "@/lib/stageColors";

export function DealLane({
  stage,
  deals,
}: {
  stage: string;
  deals: any[];
}) {
  const { setNodeRef } = useDroppable({
    id: stage, // The ID of this "drop zone" is the stage name
  });

  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  const bgColor = getLaneBackgroundColor(stage, isDarkMode);
  const borderColor = getLaneBorderColor(stage, isDarkMode);
  const headingColor = getStageHexColor(stage);

  return (
    <Box
      ref={setNodeRef}
      key={stage}
      className="p-4 rounded-lg shadow-sm h-full flex flex-col"
      style={{
        backgroundColor: bgColor,
        borderWidth: '2px',
        borderStyle: 'solid',
        borderColor: borderColor
      }}
    >
      <Heading size="3" mb="6" style={{ color: headingColor }}>
        {stage}
      </Heading>


      {/* This context tells dnd-kit that the items inside here are sortable 
        and provides the list of their IDs
      */}
      <SortableContext
        id={stage}
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <Box className="space-y-3 flex-grow overflow-y-auto">
          {deals.length === 0 && (
            <Text as="p" className="text-sm text-gray-500 text-center py-4">No deals</Text>
          )}
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </Box>
      </SortableContext>
    </Box>
  );
}