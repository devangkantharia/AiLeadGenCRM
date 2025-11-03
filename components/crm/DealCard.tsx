// Location: /components/crm/DealCard.tsx

"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { EditDealButton } from "@/components/crm/EditDealButton";
import { Box, Card, Flex, Text, useThemeContext } from "@radix-ui/themes";

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

export function DealCard({
  deal,
  isOverlay = false,
}: { deal: any; isOverlay?: boolean }) {
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

  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  return (
    <Card asChild>
      <Box
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...(!isOverlay ? listeners : {})}
        className={cn(
          isDragging && !isOverlay ? "opacity-50" : "opacity-100",
          isOverlay ? "cursor-grabbing" : "cursor-grab",
          "border hover:border-blue-500 h-full",
          isDarkMode ? "border-gray-700" : "border-gray-300"
        )}
      >
        <Flex direction="column" gap="2">
          <Flex align="center" justify="between">
            <Text as="span" weight="bold" size="3" color={currentAccentColor}>
              {deal.name}
            </Text>
            <EditDealButton deal={deal} />
          </Flex>
          <Text size="2" color={currentAccentColor}>
            {deal.Company?.name || "No Company"}
          </Text>
          <Text size="2" weight="medium" style={{ color: `var(--accent-9)` }} >
            {currencyFormatter.format(deal.value)}
          </Text>
          <Text size="1" color={currentAccentColor}>
            Closes: {dateFormatter.format(new Date(deal.closesAt))}
          </Text>
        </Flex>
      </Box>
    </Card>
  );
}