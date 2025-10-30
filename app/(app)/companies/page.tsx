// Location: /app/(app)/companies/page.tsx
"use client";

import { getCompanies } from "@/lib/actions/crm.actions"; // Corrected import
import { useQuery } from "@tanstack/react-query";
import { CreateCompanyButton } from "@/components/crm/CreateCompanyButton";
import Link from "next/link";
import { cn } from "@/lib/utils";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "lead":
      return "bg-blue-100 text-blue-800";
    case "contacted":
      return "bg-yellow-100 text-yellow-800";
    case "negotiation":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function CompaniesPage() {
  const {
    data: companies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => getCompanies(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Companies</h1>
        <CreateCompanyButton />
      </div>

      {isLoading && <p>Loading companies...</p>}

      {error && (
        <p className="text-red-500">
          Error loading companies: {(error as Error).message}
        </p>
      )}

      {companies && (
        <>
          {companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-lg shadow border">
              <h3 className="text-xl font-semibold">No companies found</h3>
              <p className="text-gray-500 mt-2">
                Create your first company to get started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {companies.map((company: any) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="block p-0"
                >
                  <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-blue-500">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold text-blue-600 truncate">
                        {company.name}
                      </h3>
                      <span
                        className={cn(
                          "text-xs font-medium px-2.5 py-0.5 rounded-full",
                          getStatusColor(company.status)
                        )}
                      >
                        {company.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p>
                        <strong>Industry:</strong>{" "}
                        {company.industry || "N/A"}
                      </p>
                      <p>
                        <strong>Size:</strong> {company.size || "N/A"}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {company.geography || "N/A"}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}