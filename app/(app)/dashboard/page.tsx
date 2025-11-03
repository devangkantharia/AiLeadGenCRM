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
  const newLeads =
    allCompanies?.filter((company) => company.status === "Discovery") || [];

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
          <Box p="4">
            <Flex justify="between" align="center">
              <Heading color={currentAccentColor} as="h2" size="4">AI Lead Generation</Heading>
              <RefreshLeadsButton />
            </Flex>
          </Box>
          {newLeads.length > 0 ? (
            <Box style={{ height: '354px', overflowY: 'auto' }} p="4">
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
            </Box>
          ) : (
            <Text as="p" size="2" >No new leads generated yet. Use the AI Assistant to find and save leads.</Text>
          )}
        </Card>
        <Card>
          <Box p="4">
            <Heading color={currentAccentColor} as="h2" size="4">Deals by Stage</Heading>
          </Box>
          {(allDeals?.length || 0) > 0 ? (
            <DealsByStageChart data={dealsByStage} allDeals={allDeals || []} />
          ) : (
            <Text as="p" size="2" color="gray">No deal data to display.</Text>
          )}
        </Card>
        <Card>
          <Box p="4">
            <Heading color={currentAccentColor} as="h2" size="4">Pipeline Value by Stage</Heading>
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
  });

  const { data: deals, isLoading: isLoadingDeals, error: dealsError } = useQuery({
    queryKey: ["deals"],
    queryFn: () => getDeals(),
  });

  const isLoading = isLoadingCompanies || isLoadingDeals;
  const error = companiesError || dealsError;

  if (isLoading) {
    return (
      <Box p="4">
        <Text>Loading dashboard...</Text>
      </Box>
    );
  }

  if (error) return <Box p="4"><Text color="red">Error loading dashboard: {(error as Error).message}</Text></Box>;

  return <Dashboard allDeals={deals || []} allCompanies={companies || []} />;
}