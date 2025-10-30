// // Location: /lib/actions/company.actions.ts
// // --- REWRITTEN FOR SUPABASE ---

// "use server"; // Mark as Server Actions

// import { revalidatePath } from "next/cache";
// import { z } from "zod";
// import { companyFormSchema } from "../schemas";
// import { auth } from "@clerk/nextjs/server";
// import { supabaseAdmin } from "../supabaseAdmin"; // Import our new Supabase client

// // Type for the form data
// type CreateCompanyParams = z.infer<typeof companyFormSchema>;

// // Helper function to get our internal User ID from the Clerk ID
// async function getUserId(clerkId: string) {
//     const { data, error } = await supabaseAdmin
//         .from("User")
//         .select("id") // We only need the 'id' column
//         .eq("clerkId", clerkId)
//         .single(); // .single() expects one row and returns an object, not an array

//     if (error || !data) {
//         throw new Error("User not found in database. Webhook sync may be pending.");
//     }
//     return data.id;
// }

// // CREATE Company
// export async function createCompany(data: CreateCompanyParams) {
//     const { userId: clerkId } = auth(); // Get the logged-in user from Clerk
//     if (!clerkId) throw new Error("User not authenticated");

//     // Get our internal 'uuid' for the user
//     const userId = await getUserId(clerkId);

//     // Validate the form data
//     const validatedData = companyFormSchema.safeParse(data);
//     if (!validatedData.success) {
//         throw new Error(`Invalid form data: ${validatedData.error.message}`);
//     }

//     // Create the new company
//     const { data: newCompany, error } = await supabaseAdmin
//         .from("Company")
//         .insert([{ ...validatedData.data, ownerId: userId }]) // Spread the form data and add our internal ownerId
//         .select(); // Ask Supabase to return the new row

//     if (error) {
//         console.error("Error creating company:", error);
//         throw new Error("Failed to create company");
//     }

//     revalidatePath("/companies"); // Refresh the /companies page cache
//     return newCompany[0];
// }

// // GET All Companies for the logged-in user
// export async function getCompanies() {
//     const { userId: clerkId } = auth();
//     if (!clerkId) throw new Error("User not authenticated");

//     const userId = await getUserId(clerkId);

//     // Fetch all companies from the "Company" table
//     const { data, error } = await supabaseAdmin
//         .from("Company")
//         .select("*") // Get all columns
//         .eq("ownerId", userId) // Where the ownerId matches our user
//         .order("createdAt", { ascending: false }); // Show newest first

//     if (error) {
//         console.error("Error fetching companies:", error);
//         throw new Error("Failed to fetch companies");
//     }

//     return data;
// }