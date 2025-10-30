// Location: /app/(auth)/sign-up/[[...sign-up]]/page.tsx
// This route is PUBLIC (set in middleware.ts)
// It renders the pre-built Sign Up component from Clerk.

import { SignUp } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <SignUp />
        </div>
    );
}
