// Location: /lib/actions/crm.actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { companyFormSchema, dealFormSchema } from "@/lib/schemas";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper function to get our internal User ID
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

// --- COMPANY ACTIONS ---
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

// --- NEW DEAL ACTIONS ---

// GET All Deals
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

// CREATE Deal
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