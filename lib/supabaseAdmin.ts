// Location: /lib/supabaseAdmin.ts
// This is our new "database connector" for all Server Actions

import { createClient } from "@supabase/supabase-js";

// We use the SERVICE_KEY for admin-level access in Server Actions
// These ! tell TypeScript that we know these values are in our .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // We set persistSession to false because this is a server-side client
        // and doesn't need to maintain a user session.
        persistSession: false,
    },
});