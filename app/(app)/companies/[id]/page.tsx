// Location: /app/(app)/companies/[id]/page.tsx
// --- STYLING & BUTTONS IMPLEMENTED ---

"use client";

import { getCompanyDetails } from "@/lib/actions/crm.actions";
import { useQuery } from "@tanstack/react-query";
import { CreateDealButton } from "@/components/crm/CreateDealButton";
import { CreatePersonButton } from "@/components/crm/CreatePersonButton";
import { cn } from "@/lib/utils";

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
    case "contacted": return "bg-yellow-100 text-yellow-800";
    case "negotiation": return "bg-purple-100 text-purple-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// --- Icons for our section headers ---
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
  // Simple icons for each event type
  if (type === 'Call') return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>;
  if (type === 'Email') return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>;
  if (type === 'Task') return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>;
};
// ---

export default function SingleCompanyPage({
  params,
}: {
  params: { id: string };
}) {
  const companyId = params.id;

  const {
    data: company,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["company", companyId],
    queryFn: () => getCompanyDetails(companyId),
  });

  if (isLoading) {
    return <p>Loading company details...</p>;
  }

  if (error) {
    return (
      <p className="text-red-500">
        Error loading company: {(error as Error).message}
      </p>
    );
  }

  if (!company) {
    return <p>Company not found.</p>;
  }

  const typedCompany = company as any;

  return (
    <div className="space-y-8">
      {/* --- 1. HEADER --- */}
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{typedCompany.name}</h1>
            <span
              className={cn(
                "text-sm font-medium px-2.5 py-0.5 rounded-full",
                getStatusColor(typedCompany.status)
              )}
            >
              {typedCompany.status}
            </span>
          </div>
          <div className="text-md text-gray-600 mt-2 space-x-4">
            <span>{typedCompany.industry || "No industry"}</span>
            <span>&middot;</span>
            <span>{typedCompany.size || "No size"}</span>
            <span>&middot;</span>
            <span>{typedCompany.geography || "No geography"}</span>
          </div>
        </div>
      </div>

      {/* --- 2. 3-COLUMN LAYOUT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* --- COLUMN 1: PEOPLE --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UsersIcon /> People
            </h2>
            {/* --- THIS IS THE FIX --- */}
            <CreatePersonButton companyId={typedCompany.id} />
          </div>
          <div className="space-y-3">
            {typedCompany.Person?.length === 0 && (
              <div className="text-sm text-gray-500 bg-white p-4 rounded-lg shadow border text-center">No people associated.</div>
            )}
            {typedCompany.Person?.map((person: any) => (
              <div key={person.id} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold">{person.firstName} {person.lastName}</h3>
                <p className="text-sm text-gray-600">{person.title || 'N/A'}</p>
                <p className="text-sm text-gray-500 mt-1">{person.email}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMN 2: DEALS --- */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <DollarSignIcon /> Deals
            </h2>
            {/* --- THIS IS THE FIX --- */}
            <CreateDealButton companyId={typedCompany.id} />
          </div>
          <div className="space-y-3">
            {typedCompany.Deal?.length === 0 && (
              <div className="text-sm text-gray-500 bg-white p-4 rounded-lg shadow border text-center">No deals associated.</div>
            )}
            {typedCompany.Deal?.map((deal: any) => (
              <div key={deal.id} className="bg-white p-4 rounded-lg shadow border">
                <h3 className="font-semibold text-blue-600">{deal.name}</h3>
                <p className="text-sm font-semibold text-gray-900">{currencyFormatter.format(deal.value)}</p>
                <p className="text-sm text-gray-600">{deal.stage}</p>
                <p className="text-xs text-gray-500 mt-1">Closes: {dateFormatter.format(new Date(deal.closesAt))}</p>
              </div>
            ))}
          </div>
        </div>

        {/* --- COLUMN 3: ACTIVITY (Timeline) --- */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <ActivityIcon /> Activity
          </h2>
          {/* This is a simple timeline */}
          <div className="space-y-6 border-l-2 border-gray-200 pl-6">
            {typedCompany.Event?.length === 0 && (
              <div className="text-sm text-gray-500 text-center">No activity recorded.</div>
            )}
            {typedCompany.Event?.map((event: any, index: number) => (
              <div key={event.id} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-7 top-1 h-3 w-3 rounded-full bg-gray-400"></div>

                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-semibold flex items-center gap-1.5">
                    <EventIcon type={event.type} /> {event.type}
                  </span>
                  <span className="text-xs text-gray-500">{dateFormatter.format(new Date(event.date))}</span>
                </div>
                <p className="text-sm text-gray-700 bg-white p-3 rounded-md shadow border">{event.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}