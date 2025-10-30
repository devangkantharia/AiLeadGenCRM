// Location: /app/(app)/deals/page.tsx
"use client";

import { getDeals } from "@/lib/actions/crm.actions"; // Corrected import
import { useQuery } from "@tanstack/react-query";
import { CreateDealButton } from "@/components/crm/CreateDealButton"; // Corrected import
import Link from "next/link";
import { cn } from "@/lib/utils";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"] as const;

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

export default function DealsPage() {
  const {
    data: deals,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["deals"],
    queryFn: () => getDeals(),
  });

  // This type definition is complex, so we'll use 'any' for the 8-hour sprint
  // This is safe because we trust our 'getDeals' server action
  const dealsInStage = (stage: string): any[] => {
    return deals?.filter((deal: any) => deal.stage === stage) || [];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Deals Pipeline</h1>
        <CreateDealButton />
      </div>

      {isLoading && <p>Loading deals...</p>}
      {error && (
        <p className="text-red-500">
          Error loading deals: {(error as Error).message}
        </p>
      )}

      {deals && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className="bg-gray-100 rounded-lg p-3"
            >
              <h3 className="font-semibold mb-3 text-center uppercase text-sm text-gray-500 tracking-wider">{stage}</h3>
              <div className="space-y-3">
                {dealsInStage(stage).length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No deals
                  </p>
                )}
                {dealsInStage(stage).map((deal: any) => (
                  <div
                    key={deal.id}
                    className="bg-white p-4 rounded-lg shadow border"
                  >
                    <h4 className="font-semibold text-blue-600 mb-1">
                      {deal.name}
                    </h4>
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
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}