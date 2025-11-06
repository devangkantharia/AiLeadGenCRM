// Location: /app/(app)/dashboard/page.tsx
"use client";

import { getCompanies, getDeals } from "@/lib/actions/crm.actions";
import { DealsByStageChart } from "@/components/crm/DealsByStageChart";
import { ValueByStageChart } from "@/components/crm/ValueByStageChart";
import { AIAssistant } from "@/components/crm/AIAssistant";
import React from "react";
import { useQuery, useQueryClient, useIsFetching } from "@tanstack/react-query";
import Link from "next/link";

import { Grid, Flex, Text, Box, Card, Heading, useThemeContext, IconButton } from '@radix-ui/themes';

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"] as const;

const RefreshIcon = ({ isFetching }: { isFetching: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={isFetching ? "animate-spin" : ""}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

function Dashboard({ allDeals, allCompanies }: { allDeals: any[], allCompanies: any[] }) {
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';
  // Filter for "Lead" status (AI-generated leads) and sort by newest first
  const newLeads =
    allCompanies?.filter((company) => company.status === "Lead")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

  const oldLeads =
    allCompanies?.filter((company) => company.status === "Lost" || "Proposal" || "Won" || "Discovery")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || [];

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
    <Box>
      <Flex justify={"between"} align={"baseline"} mb={"5"}>
        <Heading color={currentAccentColor} size="7">Dashboard</Heading>
      </Flex>

      <Grid columns={{ initial: '1', md: '2' }} gap="6">
        <Card>
          <AIAssistant />
        </Card>
        <Card>
          <Box p="4" mb="2" style={{ borderBottom: `1px solid var(--gray-a5)` }}>
            <Flex justify="between" align="center">
              <Heading color={currentAccentColor} as="h2" size="4">AI Generated Leads</Heading>
              <RefreshLeadsButton />
            </Flex>
          </Box>
          <Box style={{ height: '354px', overflowY: 'auto' }} p="4">
            {newLeads.length > 0 ? (
              <Flex direction="column" gap="2">
                {newLeads.map((lead) => (
                  <Link key={lead.id} href={`/companies/${lead.id}`} passHref>
                    <Box className={`p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border hover:border-blue-500 h-full ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                      <Flex justify="between" align="center">
                        <Text style={{ color: `var(--accent-11)` }} as="div" weight="medium" >{lead.name}</Text>
                        <Text style={{ color: `var(--accent-11)` }} size="2" >{lead.geography}</Text>
                      </Flex>
                    </Box>
                  </Link>
                ))}
              </Flex>
            ) : (
              <Text as="p" size="2" >No new leads generated yet. Use the AI Assistant to find and save leads.</Text>
            )}
            {oldLeads.length > 0 ? (
              <Flex direction="column" gap="2">
                <Text style={{ color: `var(--accent-7)` }} as="div" weight="medium" className="pt-5 pb-2" >Previous Leads</Text>
                {oldLeads.map((lead) => (
                  <Link key={lead.id} href={`/companies/${lead.id}`} passHref>
                    <Box className={`p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border hover:border-blue-500 h-full ${isDarkMode ? 'border-gray-700' : 'border-gray-300'} ${isDarkMode ? 'bg-[var(--accent-3)]' : 'bg-[var(--accent-4)]'}`}>
                      <Flex justify="between" align="center">
                        <Text style={{ color: `var(--accent-11)` }} as="div" weight="medium" >{lead.name}</Text>
                        <Text style={{ color: `var(--accent-11)` }} size="2" >{lead.geography}</Text>
                      </Flex>
                    </Box>
                  </Link>
                ))}
              </Flex>
            ) : (
              <Text as="p" size="2" >No new leads generated yet. Use the AI Assistant to find and save leads.</Text>
            )}
          </Box>
        </Card>
        <Card>
          <Box p="4" mb="2" style={{ borderBottom: `1px solid var(--gray-a5)` }}>
            <Heading color={currentAccentColor} as="h2" size="4">On-Going Deals</Heading>
          </Box>
          {(allDeals?.length || 0) > 0 ? (
            <DealsByStageChart data={dealsByStage} allDeals={allDeals || []} />
          ) : (
            <Text as="p" size="2" color="gray">No deal data to display.</Text>
          )}
        </Card>
        <Card>
          <Box p="4" mb="2" style={{ borderBottom: `1px solid var(--gray-a5)` }}>
            <Heading color={currentAccentColor} as="h2" size="4">Current Pipeline Value</Heading>
          </Box>
          {(allDeals?.length || 0) > 0 ? (
            <ValueByStageChart data={valueByStage} />
          ) : (
            <Text as="p" size="2" color="gray">No deal data to display.</Text>
          )}
        </Card>
      </Grid>
    </Box>
  );
}

function RefreshLeadsButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ['companies'] }) > 0;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['companies'] });
  };

  return (
    <IconButton variant="ghost" onClick={handleRefresh} disabled={isFetching} title="Refresh leads">
      <RefreshIcon isFetching={isFetching} />
    </IconButton>
  );
}

export default function DashboardPage() {
  const { data: companies, isLoading: isLoadingCompanies, error: companiesError } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getCompanies(),
    retry: 1, // Retry once if it fails
  });

  const { data: deals, isLoading: isLoadingDeals, error: dealsError } = useQuery({
    queryKey: ["deals"],
    queryFn: () => getDeals(),
    retry: 1, // Retry once if it fails
  });

  const isLoading = isLoadingCompanies || isLoadingDeals;
  const error = companiesError || dealsError;

  if (isLoading) {
    return (
      <Box p="4">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: "400px" }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <Text size="3" weight="medium">Loading your dashboard...</Text>
          <Text size="2" color="gray">Initializing your workspace</Text>
        </Flex>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p="4">
        <Card>
          <Flex direction="column" gap="4" p="6">
            <Heading color="red" size="5">⚠️ Dashboard Error</Heading>
            <Text size="3" color="red" weight="medium">
              {(error as Error).message || "An error occurred while loading the dashboard"}
            </Text>
            <Text size="2" color="gray">
              This might be a temporary issue. Please try refreshing the page.
            </Text>
            <Flex gap="3" mt="2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Refresh Page
              </button>
              <Link href="/companies">
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
                  View Companies
                </button>
              </Link>
            </Flex>
            <Box mt="4" p="4" style={{ background: "var(--gray-a2)", borderRadius: "8px" }}>
              <Text size="1" color="gray" as="div" mb="2">
                <strong>For developers:</strong>
              </Text>
              <Text size="1" color="gray" as="div" style={{ fontFamily: "monospace" }}>
                {(error as Error).stack || (error as Error).message}
              </Text>
            </Box>
          </Flex>
        </Card>
      </Box>
    );
  }

  return <Dashboard allDeals={deals || []} allCompanies={companies || []} />;
}