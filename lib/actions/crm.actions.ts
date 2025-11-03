// Location: /lib/actions/crm.actions.ts
// --- THIS IS THE COMPLETE, CORRECT ACTIONS FILE ---

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
// --- THIS IS THE FIX ---
import {
  companyFormSchema,
  dealFormSchema,
  personFormSchema,
  updatePersonSchema, // <-- This was missing
  eventFormSchema,    // <-- This was missing
} from "@/lib/schemas";
// --- END FIX ---
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// (getUserId, createCompany, getCompanies, getDeals, createDeal, getPeople, createPerson, getCompanyDetails... all of this code is correct and stays the same)
// ...
// ...
async function getUserId(clerkId: string) {
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", clerkId)
    .single();

  if (error || !data) throw new Error("User not found in DB.");
  return data.id;
}

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
    .select("*, Deal(*)")
    .eq("ownerId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching companies:", error);
    throw new Error("Failed to fetch companies");
  }
  if (!data) {
    return [];
  }
  // Rename 'Deal' to 'deals' to match frontend expectations
  const companiesWithDeals = data.map((company: any) => ({
    ...company,
    deals: company.Deal || [],
  }));

  return companiesWithDeals;
}

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

  // --- FIX: Map the data to lowercase 'company' ---
  // The component expects `deal.company`, but Supabase returns `deal.Company`.
  return data.map((deal: any) => ({
    ...deal,
    company: deal.Company,
  }));
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

export async function updateDealStage(dealId: string, newStage: string) {
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

export async function getCompanyDetails(companyId: string) {
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

export async function updatePerson(
  personId: string,
  data: z.infer<typeof updatePersonSchema>
) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");

  const userId = await getUserId(clerkId);

  const validatedData = updatePersonSchema.safeParse(data);
  if (!validatedData.success) {
    throw new Error(`Invalid form data: ${validatedData.error.message}`);
  }

  const { data: updatedPerson, error } = await supabaseAdmin
    .from("Person")
    .update({
      ...validatedData.data,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", personId)
    .eq("ownerId", userId)
    .select(
      `
      id,
      companyId
    `
    )
    .single();

  if (error) {
    console.error("Error updating person:", error);
    throw new Error("Failed to update person");
  }

  revalidatePath("/people");
  revalidatePath(`/companies/${updatedPerson.companyId}`);

  return updatedPerson;
}

// --- THIS IS THE MISSING FUNCTION ---
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

export async function updateDeal(dealId: string, values: { name: string; value: number }) {
  const { data, error } = await supabaseAdmin
    .from("Deal")
    .update({ name: values.name, value: values.value })
    .eq("id", dealId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/deals");
  revalidatePath(`/companies/${data?.companyId}`);
  return data;
}

// GET All Sequences (for the main /sequences page)
export async function getEmailSequences() {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);

  const { data, error } = await supabaseAdmin
    .from("EmailSequence")
    .select("*")
    .eq("ownerId", userId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching sequences:", error);
    throw new Error("Failed to fetch sequences");
  }
  return data;
}

// CREATE a new, empty sequence
export async function createEmailSequence(name: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);

  const { data: newSequence, error } = await supabaseAdmin
    .from("EmailSequence")
    .insert([{ name, ownerId: userId }])
    .select()
    .single();

  if (error) {
    console.error("Error creating sequence:", error);
    throw new Error("Failed to create sequence");
  }

  revalidatePath("/sequences");
  return newSequence;
}

// UPDATE an existing sequence (rename)
export async function updateEmailSequence(
  sequenceId: string,
  name: string
) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);

  if (!name || name.trim().length === 0) {
    throw new Error("Sequence name cannot be empty");
  }

  const { data: updatedSequence, error } = await supabaseAdmin
    .from("EmailSequence")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", sequenceId)
    .eq("ownerId", userId) // Security check
    .select()
    .single();

  if (error) {
    console.error("Error updating sequence:", error);
    throw new Error("Failed to update sequence");
  }

  revalidatePath("/sequences");
  revalidatePath(`/sequences/${sequenceId}`);

  return updatedSequence;
}

// DELETE an existing sequence
export async function deleteEmailSequence(sequenceId: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);

  const { error } = await supabaseAdmin.from("EmailSequence").delete().eq("id", sequenceId).eq("ownerId", userId);

  if (error) {
    console.error("Error deleting sequence:", error);
    throw new Error("Failed to delete sequence. Make sure it has no associated emails.");
  }

  revalidatePath("/sequences");
  return { success: true };
}

// --- NEW SEQUENCE EMAIL ACTIONS ---

// GET a single sequence AND all its emails
export async function getSequenceDetails(sequenceId: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);

  // 1. Get the sequence itself
  const { data: sequence, error: seqError } = await supabaseAdmin
    .from("EmailSequence")
    .select("*")
    .eq("id", sequenceId)
    .eq("ownerId", userId)
    .single();

  if (seqError || !sequence) {
    throw new Error("Sequence not found");
  }

  // 2. Get all emails in that sequence
  const { data: emails, error: emailsError } = await supabaseAdmin
    .from("SequenceEmail")
    .select("*")
    .eq("sequenceId", sequenceId)
    .eq("ownerId", userId)
    .order("day", { ascending: true }); // Order by day 1, 3, 7...

  if (emailsError) {
    throw new Error("Could not fetch emails for this sequence");
  }

  return { sequence, emails };
}

// UPSERT (Create or Update) an email in a sequence
export async function upsertSequenceEmail(emailData: {
  id?: string;
  sequenceId: string;
  ownerId: string;
  day: number;
  subject: string;
  content: any; // This will be the JSON from Blocknote
}) {

  const { data: newEmail, error } = await supabaseAdmin
    .from("SequenceEmail")
    .upsert({
      id: emailData.id,
      sequenceId: emailData.sequenceId,
      ownerId: emailData.ownerId,
      day: emailData.day,
      subject: emailData.subject,
      content: emailData.content,
      updatedAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error("Error upserting email:", error);
    throw new Error("Failed to save email");
  }

  revalidatePath(`/sequences/${emailData.sequenceId}`);
  return newEmail;
}

// DELETE an email from a sequence
export async function deleteSequenceEmail(emailId: string, sequenceId: string) {
  const { userId: clerkId } = auth();
  if (!clerkId) throw new Error("User not authenticated");
  const userId = await getUserId(clerkId);

  const { error } = await supabaseAdmin
    .from("SequenceEmail")
    .delete()
    .eq("id", emailId)
    .eq("ownerId", userId); // Security check

  if (error) {
    console.error("Error deleting email:", error);
    throw new Error("Failed to delete email");
  }

  revalidatePath(`/sequences/${sequenceId}`);
  return { success: true };
}