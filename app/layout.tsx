// Location: /app/layout.tsx
// This is the root layout that wraps the entire application.

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "@/lib/providers"; // Import our new Provider

import "@radix-ui/themes/styles.css";
import { Theme, ThemePanel } from "@radix-ui/themes";
import { ThemeProvider } from "next-themes";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI Lead-Gen CRM",
    description: "AI-powered CRM to find new leads.",
    icons: {
        icon: '/favicon.ico', // Path to your icon in the public folder
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        // Wrap the entire app in ClerkProvider for authentication
        <ClerkProvider>
            <html suppressHydrationWarning={true} lang="en">
                <body >
                    <ThemeProvider attribute="class">
                        <Theme appearance="light">
                            {/* Wrap the children in our Query Provider */}
                            <Providers>{children}</Providers>
                            <Toaster />
                            <ThemePanel defaultOpen={false} />

                        </Theme>
                    </ThemeProvider>
                </body>
            </html>
        </ClerkProvider>
    );
}