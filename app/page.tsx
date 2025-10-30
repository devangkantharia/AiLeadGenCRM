// Location: /app/page.tsx
// This is the main landing page.
// We will just redirect to the dashboard.
// This route is PUBLIC (set in middleware.ts)

import { redirect } from "next/navigation";

export default function RootPage() {
    // In a real app, this would be a marketing landing page.
    // For us, we just redirect logged-in users to their dashboard.
    // The middleware will handle redirecting logged-out users to sign-in.
    redirect("/dashboard");
}
