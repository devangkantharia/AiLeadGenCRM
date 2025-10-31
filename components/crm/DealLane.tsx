// Location: /components/crm/DealLane.tsx

"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DealCard } from "./DealCard";

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

  return (
    <div
      key={stage}
      className="bg-gray-100 rounded-lg p-3 min-h-[400px]" // Give it a min-height
    >
      <h3 className="font-semibold mb-3 text-center uppercase text-sm text-gray-500 tracking-wider">
        {stage}
      </h3>

      {/* This context tells dnd-kit that the items inside here are sortable 
        and provides the list of their IDs
      */}
      <SortableContext
        id={stage}
        items={deals.map((d) => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div ref={setNodeRef} className="space-y-3">
          {deals.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No deals</p>
          )}
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}