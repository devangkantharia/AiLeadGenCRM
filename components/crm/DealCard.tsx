// Location: /components/crm/DealCard.tsx

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";

// Re-create our formatters here
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function DealCard({ deal }: { deal: any }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging, // Use this to style the card while dragging
  } = useSortable({
    id: deal.id, // The unique ID for this draggable item
    data: {
      // We can pass the original deal object here
      deal: deal,
    },
  });

  // This style applies the transforms for dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners} // This attaches the mouse/touch listeners
      className={cn(
        "bg-white p-4 rounded-lg shadow border",
        isDragging ? "opacity-50" : "opacity-100" // Make it see-through while dragging
      )}
    >
      <h4 className="font-semibold text-blue-600 mb-1">{deal.name}</h4>
      <p className="text-sm text-gray-700 mb-2">
        {deal.Company?.name || "No Company"}
      </p>
      <p className="text-sm font-semibold text-gray-900">
        {currencyFormatter.format(deal.value)}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Closes: {dateFormatter.format(new Date(deal.closesAt))}
      </p>
    </div>
  );
}