// Location: /app/(app)/dashboard/page.tsx

import { getDeals } from "@/lib/actions/crm.actions";
import { DealsByStageChart } from "@/components/crm/DealsByStageChart";
import { ValueByStageChart } from "@/components/crm/ValueByStageChart";
import { AIAssistant } from "@/components/crm/AIAssistant";
import React from "react";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"] as const;

export default async function DashboardPage() {

  const allDeals = await getDeals();

  const dealsByStage = STAGES.map((stage) => {
    const dealsInStage = allDeals?.filter((deal: any) => deal.stage === stage) || [];
    return {
      name: stage,
      count: dealsInStage.length,
    };
  }).filter((item) => item.count > 0);

  const valueByStage = STAGES.map((stage) => {
    const dealsInStage = allDeals?.filter((deal: any) => deal.stage === stage) || [];
    const totalValue = dealsInStage.reduce(
      (sum: number, deal: any) => sum + deal.value,
      0
    );
    return {
      name: stage,
      value: totalValue,
    };
  });

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* AI Assistant */}
      <div className="w-full">
        <AIAssistant />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Deals by Stage</h2>
          {(allDeals?.length || 0) > 0 ? (
            <DealsByStageChart data={dealsByStage} />
          ) : (
            <p className="text-gray-500">No deal data to display.</p>
          )
          }
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h2 className="text-xl font-semibold mb-4">Pipeline Value by Stage</h2>
          {(allDeals?.length || 0) > 0 ? (
            <ValueByStageChart data={valueByStage} />
          ) : (
            <p className="text-gray-500">No deal data to display.</p>
          )
          }
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-xl font-semibold mb-4">AI Lead Generation</h2>
      </div>
    </div>
  );
}