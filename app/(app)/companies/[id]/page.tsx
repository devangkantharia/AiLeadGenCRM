// Location: /app/(app)/companies/[id]/page.tsx
import React from "react";

export default function SingleCompanyPage({
    params,
}: {
    params: { id: string };
}) {
    return (
        <div>
            <h1 className="text-2xl font-bold">Company Details</h1>
            <p>This page will show details for company with ID: {params.id}</p>
            <p>
                We will add people, deals, and events associated with this company here.
            </p>
        </div>
    );
}