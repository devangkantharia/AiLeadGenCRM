// Location: /components/crm/DealLane.tsx

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DealCard } from "./DealCard";
import { Box, Heading, Text, useThemeContext } from "@radix-ui/themes";

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


  return (
    <Box
      ref={setNodeRef} // Apply the droppable ref to the main container
      key={stage} // key should still be here for React's rendering
      className={`p-4 rounded-lg shadow-sm h-full flex flex-col ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100 border-gray-200'}`}
    >

      <Heading color={currentAccentColor} size="3" mb="6">{stage}</Heading>


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