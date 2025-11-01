// Location: /app/(app)/people/page.tsx
"use client";

import { getPeople } from "@/lib/actions/crm.actions";
import { useQuery } from "@tanstack/react-query";
import { CreatePersonButton } from "@/components/crm/CreatePersonButton";
import React from "react";
// --- 1. IMPORT THE NEW BUTTON ---
import { EditPersonButton } from "@/components/crm/EditPersonButton";

type PersonWithCompany = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  Company: {
    name: string;
  } | null;
};

export default function PeoplePage() {
  const {
    data: people,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["people"],
    queryFn: () => getPeople(),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">People</h1>
        <CreatePersonButton />
      </div>

      {isLoading && <p>Loading people...</p>}
      {error && (
        <p className="text-red-500">
          Error loading people: {(error as Error).message}
        </p>
      )}

      {people && (
        <div className="bg-white shadow rounded-lg">
          {people.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 border rounded-lg">
              <h3 className="text-xl font-semibold">No people found</h3>
              <p className="text-gray-500 mt-2">
                Create your first person to get started!
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email & Phone
                  </th>
                  {/* --- 2. ADD ACTION COLUMN HEADER --- */}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {people.map((person: any) => ( // Use 'any' to include all person fields
                  <tr key={person.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {person.firstName} {person.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {person.title || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {person.Company?.name || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      <div>{person.email || "N/A"}</div>
                      <div>{person.phone || "N/A"}</div>
                    </td>
                    {/* --- 3. ADD THE EDIT BUTTON --- */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <EditPersonButton person={person} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}