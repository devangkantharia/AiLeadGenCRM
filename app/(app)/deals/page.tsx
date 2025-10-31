// Location: /app/(app)/deals/page.tsx
// --- COMPLETE REWRITE FOR DRAG-AND-DROP ---

"use client";

import { getDeals, updateDealStage } from "@/lib/actions/crm.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreateDealButton } from "@/components/crm/CreateDealButton";
import React, { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { DealLane } from "@/components/crm/DealLane";

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

      // 2. Snapshot the previous value
      const previousDeals = queryClient.getQueryData<any[]>(["deals"]);

      // 3. Optimistically update to the new value
      queryClient.setQueryData(
        ["deals"],
        (old: any[] | undefined = []) =>
          old.map((d) =>
            d.id === optimisticUpdate.dealId
              ? { ...d, stage: optimisticUpdate.newStage }
              : d
          )
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

  // This function is called when you drop a card
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    // active = the card you're dragging (our <DealCard>)
    // over = the column you dropped it on (our <DealLane>)

    if (over && active.id !== over.id) {
      const activeDeal = active.data.current?.deal;
      const newStage = over.id as Stage;

      if (activeDeal.stage !== newStage) {
        console.log(`Moving deal ${activeDeal.id} to ${newStage}`);

        // Call our mutation function
        handleUpdateStage({ dealId: activeDeal.id, newStage });
      }
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

  // Use the local state for rendering, but the query state for loading/error
  if (isLoading) return <p>Loading deals...</p>;
  if (error) return <p className="text-red-500">Error loading deals: {(error as Error).message}</p>;

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Deals Pipeline</h1>
          <CreateDealButton />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map((stage) => (
            <DealLane
              key={stage}
              stage={stage}
              deals={dealsInStage(stage)}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
}