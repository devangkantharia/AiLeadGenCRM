// Location: /lib/schemas.ts
// --- THIS IS THE COMPLETE SCHEMA FILE ---

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
  value: z.preprocess(
    (a) => (String(a) === "" ? 0 : parseFloat(String(a))),
    z.number().min(0, { message: "Value must be 0 or more." }).default(0)
  ),
  closesAt: z.string().date("Must be a valid date."),
});

export const personFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Must be a valid email." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
  companyId: z.string().uuid({ message: "Please select a company." }),
});

// --- Schema for the "Edit Person" form ---
export const updatePersonSchema = z.object({
  firstName: z.string().min(2, { message: "First name is required." }),
  lastName: z.string().optional(),
  email: z.string().email({ message: "Must be a valid email." }).optional().or(z.literal("")),
  phone: z.string().optional(),
  title: z.string().optional(),
});

// --- Schema for the "Activity" form ---
export const eventFormSchema = z.object({
  companyId: z.string().uuid(),
  personId: z.string().uuid().optional().nullable(),
  dealId: z.string().uuid().optional().nullable(),
  type: z.enum(["Note", "Call", "Email", "Task"]),
  date: z.string().date("Must be a valid date."),
  content: z.string(),
  isTask: z.boolean().default(false),
  isDone: z.boolean().default(false),
});

// --- Schema for the "Edit Deal" form ---
export const updateDealSchema = z.object({
  name: z.string().min(2, { message: "Deal name is required." }),
  value: z.preprocess(
    (a) => (String(a) === "" ? 0 : parseFloat(String(a))),
    z.number().min(0, { message: "Value must be 0 or more." })
  ),
});