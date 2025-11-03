// Location: /app/(app)/companies/[id]/page.tsx
// --- ALL TYPOS AND IMPORTS FIXED ---

"use client";

// --- FIX: Corrected all imports ---
import { getCompanyDetails } from "@/lib/actions/crm.actions";
import { useQuery } from "@tanstack/react-query";
import { CreateDealButton } from "@/components/crm/CreateDealButton";
import { useBreadcrumb } from "@/components/crm/BreadcrumbContext";
import { CreatePersonButton } from "@/components/crm/CreatePersonButton";
import { ActivityForm } from "@/components/crm/ActivityForm"; // <-- This was the broken import
import { cn } from "@/lib/utils";
import { EditPersonButton } from "@/components/crm/EditPersonButton";
import { EditDealButton } from "@/components/crm/EditDealButton"; // <-- New import for EditDealButton
import { Card, Flex, Heading, Text, Box, Grid, useThemeContext } from "@radix-ui/themes";
import Link from "next/link";
import { useEffect } from "react";
// --- END FIX ---


// (Formatters are unchanged)
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
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "lead": return "bg-blue-100 text-blue-800";
    case "discovery": return "bg-blue-100 text-blue-800";
    case "contacted": return "bg-yellow-100 text-yellow-800";
    case "proposal": return "bg-yellow-100 text-yellow-800";
    case "negotiation": return "bg-purple-100 text-purple-800";
    case "won": return "bg-green-100 text-green-800";
    case "lost": return "bg-red-100 text-red-800";
    default: return "bg-gray-100 text-gray-800";
  }
};
const getEventTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case "note": return "bg-gray-100 text-gray-800";
    case "call": return "bg-green-100 text-green-800";
    case "email": return "bg-blue-100 text-blue-800";
    case "task": return "bg-yellow-100 text-yellow-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// --- FIX: Added full SVG icon code ---
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
);
const DollarSignIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
);
const EventIcon = ({ type }: { type: string }) => {
  if (type === 'Call') return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
  if (type === 'Email') return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
  if (type === 'Task') return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};
// --- END FIX ---

export default function SingleCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  // --- FIX: Move hook call to the top level ---
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const breadcrumb = useBreadcrumb();

  const companyId = params.id;

  const {
    data: company,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompanyDetails(companyId),
  });

  // Set the breadcrumb name when the company data is loaded
  useEffect(() => {
    if (company) {
      breadcrumb?.setChildName(company.name);
    }
  }, [company, breadcrumb]);

  if (isLoading) {
    return <p>Loading company details...</p>;
  }

  if (error) {
    return (
      <Text as="p" className="text-red-500">
        Error loading company: {(error as Error).message}
      </Text>
    );
  }

  if (!company) {
    return <p>Company not found.</p>;
  }

  const typedCompany = company as any;

  return (
    <Box className="space-y-8">
      <Text as="div" size="2" mb="4">
        <Link href="/companies" style={{ color: `var(--accent-11)` }} className="hover:underline">&larr; Back to all companies page</Link>
      </Text>
      {/* --- 1. HEADER --- */}
      <Flex justify="between" align="center">
        <Box>
          <Flex align="center" gap="3" mb="2">
            <Heading color={currentAccentColor} size="7">{typedCompany.name}</Heading>
            <Text size="2" className={cn("px-2.5 py-0.5 rounded-full", getStatusColor(typedCompany.status))}>{typedCompany.status}</Text>
          </Flex>
          <Flex gap="4" mt="2">
            <Text style={{ color: `var(--accent-11)` }} as="span" weight="regular">{typedCompany.industry || "No industry"}</Text>
            <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{typedCompany.size || "No size"}</Text>
            <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{typedCompany.geography || "No geography"}</Text>
          </Flex>
        </Box>
      </Flex>

      {/* --- 2. 3-COLUMN LAYOUT --- */}
      <Grid gap="8" columns={{ initial: "1", md: "2", lg: "3" }}>
        {/* --- COLUMN 1: PEOPLE --- */}
        <Box width="auto" minWidth="300px">
          <Flex justify="between" align="center" mb="2">
            <Text style={{ minHeight: `50px`, color: `var(--accent-11)` }} as="div" weight="bold">People</Text>
            <CreatePersonButton companyId={typedCompany.id} />
          </Flex>
          <Box>
            {typedCompany.Person?.length === 0 && (
              <Card mb="3" style={{ padding: `16px 15px` }}><Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">No people associated.</Text></Card>
            )}
            {typedCompany.Person?.map((person: any) => (
              <Card key={person.id} mb="3">
                <Flex justify="between" align="center">
                  <Box>
                    <Text style={{ color: `var(--accent-11)` }} as="span" weight="medium" size="3">{person.firstName} {person.lastName} - </Text>
                    <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{person.title || 'N/A'}</Text>
                    <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{person.email}</Text>
                  </Box>
                  <EditPersonButton person={person} />
                </Flex>
              </Card>
            ))}
          </Box>
        </Box>

        {/* --- COLUMN 2: DEALS --- */}
        <Box width="auto" minWidth="300px">
          <Flex justify="between" align="center" mb="2">
            <Text style={{ minHeight: `50px`, color: `var(--accent-11)` }} as="div" weight="bold">Deals</Text>
            <CreateDealButton companyId={typedCompany.id} />
          </Flex>
          <Box>
            {typedCompany.Deal?.length === 0 && (
              <Card mb="3" style={{ padding: `16px 15px` }}><Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">No deals associated.</Text></Card>
            )}
            {typedCompany.Deal?.map((deal: any) => (
              <Card key={deal.id} mb="3">
                <Flex justify="between" align="center" mb="1">
                  <Text style={{ color: `var(--accent-11)` }} as="span" weight="medium" size="3">{deal.name}</Text>
                  <EditDealButton deal={deal} />
                </Flex>
                <Text style={{ color: `var(--accent-8)` }} as="span" weight="medium">{currencyFormatter.format(deal.value)} - </Text>
                <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{deal.stage}</Text>
                <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">Closes: {dateFormatter.format(new Date(deal.closesAt))}</Text>
              </Card>
            ))}
          </Box>
        </Box>

        {/* --- COLUMN 3: ACTIVITY (UPDATED) --- */}
        <Box width="auto" minWidth="300px">
          <Text style={{ minHeight: `50px`, color: `var(--accent-11)` }} as="div" weight="bold">Activity</Text>
          <ActivityForm companyId={typedCompany.id} />
          <Box mt={"20px"}>
            {typedCompany.Event?.length === 0 && (
              <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">No activity recorded.</Text>
            )}
            {typedCompany.Event?.map((event: any, index: number) => (
              <Box key={event.id} position="relative" mb="6">
                <Box style={{ position: "absolute", left: -28, top: 4, height: 12, width: 12, borderRadius: "50%", background: "#9ca3af" }} />
                <Flex justify="between" align="center" mb="1">
                  <Text style={{ color: `var(--accent-11)` }} as="span" weight="medium">{event.type} - </Text>
                  <Text style={{ color: `var(--accent-11)` }} as="span" weight="regular">{dateFormatter.format(new Date(event.date))}</Text>
                </Flex>
                <Card><Text>{event.content}</Text></Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>
    </Box>
  );
}