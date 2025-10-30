// Location: /app/(auth)/sign-in/[[...sign-in]]/page.tsx
// This route is PUBLIC (set in middleware.ts)
// It renders the pre-built Sign In component from Clerk.

import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <SignIn />
        </div>
    );
}
