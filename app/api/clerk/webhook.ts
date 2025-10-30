// Location: /app/api/clerk/webhook.ts
// --- REWRITTEN WITH UPSERT LOGIC ---

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { deleteUser, upsertUser } from "@/lib/actions/user.actions"; // <-- Import upsertUser
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error(
            "Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local"
        );
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response("Error occurred -- no svix headers", {
            status: 400,
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        }) as WebhookEvent;
    } catch (err) {
        console.error("Error verifying webhook:", err);
        return new Response("Error occurred", { status: 400 });
    }

    const eventType = evt.type;

    // --- NEW SIMPLIFIED LOGIC ---

    // Handle create AND update with one function
    if (eventType === "user.created" || eventType === "user.updated") {
        const { id, email_addresses, first_name, last_name, image_url } = evt.data;

        const user = {
            clerkId: id,
            email: email_addresses[0].email_address,
            firstName: first_name || "",
            lastName: last_name || "",
            photo: image_url || "",
        };

        // Use our new upsert function
        const upsertedUser = await upsertUser(id, user);
        return NextResponse.json({ message: "OK", user: upsertedUser });
    }

    // Handle delete
    if (eventType === "user.deleted") {
        const { id } = evt.data;
        if (!id) {
            return new Response("Error occurred -- user ID is missing", { status: 400 });
        }
        const deletedUser = await deleteUser(id);
        return NextResponse.json({ message: "OK", user: deletedUser });
    }

    return new Response("", { status: 200 });
}