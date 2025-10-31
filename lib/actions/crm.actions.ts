// Location: /lib/actions/crm.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
// --- ADD eventFormSchema ---
import {
  companyFormSchema,
  dealFormSchema,
  personFormSchema,
  eventFormSchema, // <-- ADDED
} from "@/lib/schemas";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper function (no change)
async function getUserId(clerkId: string) {
  // ... (code is unchanged)
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", clerkId)
    .single();

  if (error || !data) {
    throw new Error("User not found in database. Webhook sync may be pending.");
  }
  return data.id;
}

// --- COMPANY ACTIONS (no change) ---
export async function createCompany(data: z.infer<typeof companyFormSchema>) {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const validatedData = companyFormSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error(`Invalid form data: ${validatedData.error.message}`);
  }
  const { data: newCompany, error } = await supabaseAdmin
    .from("Company")
    .insert([{ ...validatedData.data, ownerId: userId }])
    .select();
  if (error) {
    console.error("Error creating company:", error);
    throw new Error("Failed to create company");
  }
  revalidatePath("/companies");
  return newCompany[0];
}

export async function getCompanies() {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const { data, error } = await supabaseAdmin
    .from("Company")
    .select("*")
    .eq("ownerId", userId)
    .order("createdAt", { ascending: false });
  if (error) {
    console.error("Error fetching companies:", error);
    throw new Error("Failed to fetch companies");
  }
  return data;
}

// --- DEAL ACTIONS (no change) ---
export async function getDeals() {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const { data, error } = await supabaseAdmin
    .from("Deal")
    .select(
      `
      *,
      Company ( name )
    `
    )
    .eq("ownerId", userId)
    .order("closesAt", { ascending: true });
  if (error) {
    console.error("Error fetching deals:", error);
    throw new Error("Failed to fetch deals");
  }
  return data;
}

export async function createDeal(data: z.infer<typeof dealFormSchema>) {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const validatedData = dealFormSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error(`Invalid form data: ${validatedData.error.message}`);
  }
  const { data: newDeal, error } = await supabaseAdmin
    .from("Deal")
    .insert([{ ...validatedData.data, ownerId: userId }])
    .select();
  if (error) {
    console.error("Error creating deal:", error);
    throw new Error("Failed to create deal");
  }
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return newDeal[0];
}

export async function updateDealStage(dealId: string, newStage: string) {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const { data: deal } = await supabaseAdmin
    .from("Deal")
    .select("ownerId, companyId")
    .eq("id", dealId)
    .single();
  if (deal?.ownerId !== userId) {
    throw new Error("Unauthorized");
  }
  const { data: updatedDeal, error } = await supabaseAdmin
    .from("Deal")
    .update({ stage: newStage, updatedAt: new Date().toISOString() })
    .eq("id", dealId)
    .select("id")
    .single();
  if (error) {
    console.error("Error updating deal stage:", error);
    throw new Error("Failed to update deal");
  }
  if (deal.companyId && newStage) {
    await supabaseAdmin
      .from("Company")
      .update({ status: newStage, updatedAt: new Date().toISOString() })
      .eq("id", deal.companyId)
      .eq("ownerId", userId);
  }
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/companies");
  revalidatePath(`/companies/${deal.companyId}`);
  return updatedDeal;
}

// --- PERSON ACTIONS (no change) ---
export async function getPeople() {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const { data, error } = await supabaseAdmin
    .from("Person")
    .select(
      `
      *,
      Company ( name )
    `
    )
    .eq("ownerId", userId)
    .order("createdAt", { ascending: false });
  if (error) {
    console.error("Error fetching people:", error);
    throw new Error("Failed to fetch people");
  }
  return data;
}

export async function createPerson(data: z.infer<typeof personFormSchema>) {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const validatedData = personFormSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error(`Invalid form data: ${validatedData.error.message}`);
  }
  const { data: newPerson, error } = await supabaseAdmin
    .from("Person")
    .insert([{ ...validatedData.data, ownerId: userId }])
    .select();
  if (error) {
    console.error("Error creating person:", error);
    throw new Error("Failed to create person");
  }
  revalidatePath("/people");
  return newPerson[0];
}

// --- COMPANY DETAILS ACTION (no change) ---
export async function getCompanyDetails(companyId: string) {
  // ... (code is unchanged)
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);
  const { data, error } = await supabaseAdmin
    .from("Company")
    .select(
      `
      *,
      Person (*),
      Deal (*),
      Event (*)
    `
    )
    .eq("id", companyId)
    .eq("ownerId", userId)
    .single();
  if (error) {
    console.error("Error fetching company details:", error);
    throw new Error("Failed to fetch company details");
  }
  return data;
}

// --- NEW EVENT ACTION ---
export async function createEvent(data: z.infer<typeof eventFormSchema>) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");

  const userId = await getUserId(clerkId);

  // Validate data
  const validatedData = eventFormSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error(`Invalid form data: ${validatedData.error.message}`);
  }

  // Create the event
  const { data: newEvent, error } = await supabaseAdmin
    .from("Event")
    .insert([{ ...validatedData.data, ownerId: userId }])
    .select();

  if (error) {
    console.error("Error creating event:", error);
    throw new Error("Failed to create event");
  }

  // Revalidate the company page to show the new event
  revalidatePath(`/companies/${validatedData.data.companyId}`);

  return newEvent[0];
}