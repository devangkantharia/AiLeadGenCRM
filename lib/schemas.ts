// Location: /lib/schemas.ts
// This file defines the "shape" of our data for validation.

import { z } from "zod";

// Schema for the "Create Company" form
export const companyFormSchema = z.object({
    name: z
        .string()
        .min(2, { message: "Company name must be at least 2 characters." }),
    industry: z.string().optional(),
    size: z.string().optional(),
    geography: z.string().optional(),
});

// We will add more schemas here for People, Deals, etc.