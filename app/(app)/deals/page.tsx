// Location: /app/(app)/deals/page.tsx
// --- COMPLETE REWRITE FOR DRAG-AND-DROP ---

"use client";

import { getDeals, updateDealStage } from "@/lib/actions/crm.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateDealButton } from "@/components/crm/CreateDealButton";
import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DealLane } from "@/components/crm/DealLane";
import { DealCard } from "@/components/crm/DealCard";
import { Box, Flex, Grid, Heading, Text, useThemeContext } from "@radix-ui/themes";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

export default function DealsPage() {
  const queryClient = useQueryClient();

  const {
    data: deals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deals"],
    queryFn: () => getDeals(),
  });

  // We need to use local state to enable optimistic updates
  // We'll set this state once the query loads
  const [localDeals, setLocalDeals] = useState<any[] | undefined>(undefined);
  const [activeDeal, setActiveDeal] = useState<any | null>(null);

  React.useEffect(() => {
    if (deals) {
      setLocalDeals(deals);
    }
  }, [deals]);

  // The mutation function to update the deal stage
  const { mutate: handleUpdateStage } = useMutation({
    mutationFn: (args: { dealId: string; newStage: Stage }) =>
      updateDealStage(args.dealId, args.newStage),

    // This is the "optimistic update" magic
    onMutate: async (optimisticUpdate) => {
      // 1. Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ["deals"] });

      // 2. Optimistically update to the new value
      const previousDeals = queryClient.getQueryData<any[]>(["deals"]);
      queryClient.setQueryData(
        ["deals"],
        (old: any[] | undefined = []) =>
          old
            ? old.map((d) =>
              d.id === optimisticUpdate.dealId
                ? { ...d, stage: optimisticUpdate.newStage }
                : d
            )
            : []
      );

      // Return a context object with the snapshotted value
      return { previousDeals };
    },
    // If the mutation fails, roll back
    onError: (err, newTodo, context) => {
      queryClient.setQueryData(["deals"], context?.previousDeals);
    },
    // Always refetch after error or success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
    },
  });

  // Store the active deal when a drag starts
  function handleDragStart(event: DragStartEvent) {
    setActiveDeal(event.active.data.current?.deal ?? null);
  }

  // This function is called when you drop a card
  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null); // Clear active deal
    const { active, over } = event;

    // active = the card you're dragging (our <DealCard>)
    // over = the column you dropped it on (our <DealLane>)

    if (!over) {
      return; // Dropped outside of any droppable area
    }

    const dealToUpdate = active.data.current?.deal;
    if (!dealToUpdate) {
      return;
    }

    // `over.id` can be the lane ID or another card's ID.
    // `over.data.current?.sortable?.containerId` will reliably give us the lane ID.
    const newStage = over.data.current?.sortable?.containerId || over.id;

    if (dealToUpdate.stage !== newStage) {
      console.log(`Moving deal ${dealToUpdate.id} to ${newStage}`);
      // Call our mutation function
      handleUpdateStage({ dealId: dealToUpdate.id, newStage: newStage as Stage });
    }
  }

  // Use sensors for pointer (mouse) and keyboard
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require mouse to move 8px before drag starts
      },
    })
  );

  // Helper to filter deals for a specific stage from our *local* state
  const dealsInStage = (stage: Stage): any[] => {
    return localDeals?.filter((deal: any) => deal.stage === stage) || [];
  };

  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  // Use the local state for rendering, but the query state for loading/error
  if (isLoading) return <p>Loading deals...</p>;
  if (error) return <Text as="p" className="text-red-500">Error loading deals: {(error as Error).message}</Text>;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <Box>
        <Flex justify={"between"} align={"baseline"} mb={"5"}>
          <Heading color={currentAccentColor} size="7">Deals Pipeline</Heading>
          <CreateDealButton />
        </Flex>

        <Grid columns="5" gap="4" width="auto" className="h-[80vh]">
          {STAGES.map((stage) => (
            <DealLane
              key={stage}
              stage={stage}
              deals={dealsInStage(stage)}
            />
          ))}
        </Grid>
      </Box>
      <DragOverlay>
        {activeDeal ? (
          <DealCard deal={activeDeal} isOverlay={true} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}