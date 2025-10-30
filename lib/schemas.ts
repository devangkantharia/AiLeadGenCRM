// Location: /lib/schemas.ts

import { z } from "zod";

export const companyFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." }),
  industry: z.string().optional(),
  size: z.string().optional(),
  geography: z.string().optional(),
});

export const dealFormSchema = z.object({
  name: z.string().min(2, { message: "Deal name is required." }),
  companyId: z.string().uuid({ message: "Please select a company." }),
  stage: z.enum([
    "Discovery",
    "Proposal",
    "Negotiation",
    "Won",
    "Lost",
  ]),
  // Pre-process input: it comes as a string, we convert to number
  // THIS IS THE FIX: Added .optional() and default(0) to handle empty string
  value: z.preprocess(
    (a) => (String(a) === "" ? 0 : parseFloat(String(a))),
    z.number().min(0, { message: "Value must be 0 or more." }).default(0)
  ),
  // Input comes as "YYYY-MM-DD", which is a valid date string
  closesAt: z.string().date("Must be a valid date."),
});