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
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Helper function to get user ID, auto-creating if doesn't exist (for demo purposes)
async function getUserId(clerkId: string) {
  // First, try to get the existing user by clerkId
  const { data, error } = await supabaseAdmin
    .from("User")
    .select("id")
    .eq("clerkId", clerkId)
    .single();

  // If user exists, return their ID
  if (data && !error) {
    return data.id;
  }

  // If user doesn't exist, auto-create them (for demo/development purposes)
  console.log(`[AUTO-CREATE] User not found for clerkId: ${clerkId}, creating now...`);

  try {
    // Fetch the real user data from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);
    const userEmail = clerkUser.emailAddresses[0]?.emailAddress || `user_${clerkId}@demo.local`;

    const { data: newUser, error: createError } = await supabaseAdmin
      .from("User")
      .insert([{
        clerkId,
        email: userEmail,
        firstName: clerkUser.firstName || "Demo",
        lastName: clerkUser.lastName || "User",
        photo: clerkUser.imageUrl || ""
      }])
      .select("id")
      .single();

    if (createError) {
      // If it's a duplicate email error, try to find the existing user by email
      // and update their clerkId (user might have recreated their Clerk account)
      if (createError.code === '23505' && createError.message.includes('email')) {
        console.log(`[AUTO-CREATE] Email ${userEmail} already exists, updating clerkId...`);

        const { data: existingUser, error: updateError } = await supabaseAdmin
          .from("User")
          .update({ clerkId, updatedAt: new Date().toISOString() })
          .eq("email", userEmail)
          .select("id")
          .single();

        if (updateError || !existingUser) {
          console.error("[AUTO-CREATE] Failed to update existing user:", updateError);
          throw new Error("Failed to update user record. Please contact support.");
        }

        console.log(`[AUTO-CREATE] Updated existing user with new clerkId: ${existingUser.id}`);
        return existingUser.id;
      }

      console.error("[AUTO-CREATE] Failed to create user:", createError);
      throw new Error("Failed to auto-create user. Please contact support.");
    }

    if (!newUser) {
      throw new Error("Failed to auto-create user. Please contact support.");
    }

    console.log(`[AUTO-CREATE] Successfully created user with ID: ${newUser.id} (${userEmail})`);
    return newUser.id;
  } catch (err) {
    console.error("[AUTO-CREATE] Error during user creation:", err);
    throw new Error("User initialization failed. Please try refreshing the page.");
  }
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
  // Still validate user exists, but don't filter by ownerId (demo mode)
  await getUserId(clerkId);

  // Fetch ALL companies for demo purposes
  const { data, error } = await supabaseAdmin
    .from("Company")
    .select("*, Deal(*)")
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
  // Still validate user exists, but don't filter by ownerId (demo mode)
  await getUserId(clerkId);

  // Fetch ALL deals for demo purposes
  const { data, error } = await supabaseAdmin
    .from("Deal")
    .select(
      `
      *,
      Company ( name )
    `
    )
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
  // Validate user exists but allow editing any deal (demo mode)
  await getUserId(clerkId);

  // First fetch the deal to get companyId (no owner check - demo mode)
  const { data: deal, error: fetchError } = await supabaseAdmin
    .from("Deal")
    .select("companyId")
    .eq("id", dealId)
    .single();
  if (fetchError) {
    console.error("Error fetching deal:", fetchError);
    throw new Error("Deal not found");
  }

  // Update deal without owner check (demo mode - any user can update)
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

  // Update associated company status if applicable (no owner check - demo mode)
  if (deal.companyId && newStage) {
    await supabaseAdmin
      .from("Company")
      .update({ status: newStage, updatedAt: new Date().toISOString() })
      .eq("id", deal.companyId);
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
  // Still validate user exists, but don't filter by ownerId (demo mode)
  await getUserId(clerkId);

  // Fetch ALL people for demo purposes
  const { data, error } = await supabaseAdmin
    .from("Person")
    .select(
      `
      *,
      Company ( name )
    `
    )
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
  // Still validate user exists, but don't filter by ownerId (demo mode)
  await getUserId(clerkId);

  // Fetch company details regardless of owner for demo purposes
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
  // Validate user exists but allow editing any person (demo mode)
  await getUserId(clerkId);

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
    // No owner check (demo mode - any user can update)
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
  // Still validate user exists, but don't filter by ownerId (demo mode)
  await getUserId(clerkId);

  // Fetch ALL sequences for demo purposes
  const { data, error } = await supabaseAdmin
    .from("EmailSequence")
    .select("*")
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
  // Validate user exists but allow editing any sequence (demo mode)
  await getUserId(clerkId);

  if (!name || name.trim().length === 0) {
    throw new Error("Sequence name cannot be empty");
  }

  const { data: updatedSequence, error } = await supabaseAdmin
    .from("EmailSequence")
    .update({ name, updatedAt: new Date().toISOString() })
    .eq("id", sequenceId)
    // No owner check (demo mode - any user can update)
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
  // Validate user exists but allow deleting any sequence (demo mode)
  await getUserId(clerkId);

  const { error } = await supabaseAdmin
    .from("EmailSequence")
    .delete()
    .eq("id", sequenceId);
  // No owner check (demo mode - any user can delete)

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
  // Still validate user exists, but don't filter by ownerId (demo mode)
  await getUserId(clerkId);

  // 1. Get the sequence itself - no owner check for demo mode
  const { data: sequence, error: seqError } = await supabaseAdmin
    .from("EmailSequence")
    .select("*")
    .eq("id", sequenceId)
    .single();

  if (seqError || !sequence) {
    throw new Error("Sequence not found");
  }

  // 2. Get all emails in that sequence - no owner check for demo mode
  const { data: emails, error: emailsError } = await supabaseAdmin
    .from("SequenceEmail")
    .select("*")
    .eq("sequenceId", sequenceId)
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
  // Validate user exists but allow deleting any email (demo mode)
  await getUserId(clerkId);

  const { error } = await supabaseAdmin
    .from("SequenceEmail")
    .delete()
    .eq("id", emailId);
  // No owner check (demo mode - any user can delete)

  if (error) {
    console.error("Error deleting email:", error);
    throw new Error("Failed to delete email");
  }

  revalidatePath(`/sequences/${sequenceId}`);
  return { success: true };
}