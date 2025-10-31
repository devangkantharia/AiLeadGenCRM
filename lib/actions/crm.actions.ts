// Location: /lib/actions/crm.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  companyFormSchema,
  dealFormSchema,
  personFormSchema,
} from "@/lib/schemas";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper function (no change)
async function getUserId(clerkId: string) {
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
export async function createCompany(
  data: z.infer<typeof companyFormSchema>
) {
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

// --- PERSON ACTIONS (no change) ---
export async function getPeople() {
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

// --- GET FULL COMPANY DETAILS (This is the function we're calling) ---
export async function getCompanyDetails(companyId: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");

  // Make sure the user owns this company
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
    .single(); // We expect only one company

  if (error) {
    console.error("Error fetching company details:", error);
    throw new Error("Failed to fetch company details");
  }

  return data;
}

// --- UPDATE DEAL STAGE ---
export async function updateDealStage(dealId: string, newStage: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");

  // Ensure the user owns this deal
  const userId = await getUserId(clerkId);

  // --- STEP 1: Fetch the deal and its companyId ---
  const { data: deal } = await supabaseAdmin
    .from("Deal")
    .select("ownerId, companyId") // Get the companyId
    .eq("id", dealId)
    .single();

  if (deal?.ownerId !== userId) {
    throw new Error("Unauthorized");
  }

  // --- STEP 2: Update the deal's stage (same as before) ---
  const { data: updatedDeal, error } = await supabaseAdmin
    .from("Deal")
    .update({ stage: newStage, updatedAt: new Date().toISOString() })
    .eq("id", dealId)
    .select("id") // We only need the ID back
    .single();

  if (error) {
    console.error("Error updating deal stage:", error);
    throw new Error("Failed to update deal");
  }

  // --- STEP 3: (NEW!) Also update the parent company's status ---
  if (deal.companyId && newStage) {
    await supabaseAdmin
      .from("Company")
      .update({ status: newStage, updatedAt: new Date().toISOString() })
      .eq("id", deal.companyId)
      .eq("ownerId", userId); // Final security check
  }

  // --- STEP 4: (NEW!) Revalidate all the paths that show this data ---
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  revalidatePath("/companies"); // This revalidates the main company list
  revalidatePath(`/companies/${deal.companyId}`); // This revalidates the specific company's page

  return updatedDeal;
}