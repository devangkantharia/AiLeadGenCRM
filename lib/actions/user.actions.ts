// Location: /lib/actions/user.actions.ts
// --- REWRITTEN WITH UPSERT LOGIC ---

"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "../supabaseAdmin";

interface UserParams {
    clerkId: string;
    firstName: string;
    lastName: string;
    email: string;
    photo: string;
}

// CREATE user (this is still fine)
export async function createUser(user: UserParams) {
    const { data, error } = await supabaseAdmin.from("User").insert([user]).select();

    if (error) {
        console.error("Error creating user:", error);
        throw new Error("Failed to create user");
    }
    return data[0];
}

// NEW: UPSERT (Update OR Insert) user
// This is more robust than separate create/update
export async function upsertUser(clerkId: string, user: Partial<UserParams>) {
    const { data, error } = await supabaseAdmin
        .from("User")
        .upsert({ ...user, clerkId }, { onConflict: "clerkId" }) // <-- The magic
        .select();

    if (error) {
        console.error("Error upserting user:", error);
        throw new Error("Failed to upsert user");
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    return data[0];
}

// DELETE user (this is still fine)
export async function deleteUser(clerkId: string) {
    const { data, error } = await supabaseAdmin
        .from("User")
        .delete()
        .eq("clerkId", clerkId)
        .select();

    if (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user");
    }

    revalidatePath("/");
    return data ? data[0] : null;
}