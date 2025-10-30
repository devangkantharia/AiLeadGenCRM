// Location: /app/(app)/people/page.tsx
// --- NEW UI ---

"use client";

import { getPeople } from "@/lib/actions/crm.actions";
import { useQuery } from "@tanstack/react-query";
import { CreatePersonButton } from "@/components/crm/CreatePersonButton";

export default function PeoplePage() {
    const {
        data: people,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["people"], // Unique query key for people
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
                        // --- NEW TABLE UI ---
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Name
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Title
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Company
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Email & Phone
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {people.map((person: any) => (
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