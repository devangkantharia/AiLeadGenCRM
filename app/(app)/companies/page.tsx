// Location: /app/(app)/companies/page.tsx
// This is the main page that shows the list of companies.
// It is a client component so it can use TanStack Query.

"use client";

import { getCompanies } from "@/lib/actions/company.actions";
import { useQuery } from "@tanstack/react-query";
import { CreateCompanyButton } from "@/components/crm/CreateCompanyButton";
import Link from "next/link"; // Import Link

export default function CompaniesPage() {
    // Use TanStack Query to fetch companies
    const {
        data: companies,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["companies"], // This key ensures TanStack Query caches the data
        queryFn: async () => await getCompanies(),
    });

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Companies</h1>
                <CreateCompanyButton />
            </div>

            {isLoading && <p>Loading companies...</p>}

            {error && (
                <p className="text-red-500">
                    Error loading companies: {error.message}
                </p>
            )}

            {companies && (
                <div className="bg-white shadow rounded-lg">
                    {companies.length === 0 ? (
                        <p className="p-4">
                            No companies found. Create one to get started!
                        </p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                            {companies.map((company) => (
                                <li
                                    key={company.id}
                                    className="p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <Link
                                        href={`/companies/${company.id}`}
                                        className="block"
                                    >
                                        <h3 className="text-lg font-semibold text-blue-600 hover:underline">
                                            {company.name}
                                        </h3>
                                        <div className="flex space-x-4 text-sm text-gray-600 mt-1">
                                            <span>{company.industry || "No industry"}</span>
                                            <span>&middot;</span>
                                            <span>{company.size || "No size"}</span>
                                            <span>&middot;</span>
                                            <span>{company.geography || "No geography"}</span>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}