// Location: /app/(app)/layout.tsx
// This layout wraps all our *protected* pages (dashboard, companies, etc.)

"use client"; // Required for pathname hook

import { UserButton } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // We'll use our cn utility

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navLinks = [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/companies", label: "Companies" },
        { href: "/people", label: "People" },
        { href: "/deals", label: "Deals" },
        { href: "/sequences", label: "Sequences" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* --- Sidebar --- */}
            <aside className="w-64 bg-white p-4 border-r">
                <h1 className="font-bold text-xl mb-6 text-blue-700">AI Lead-Gen</h1>
                <nav className="flex flex-col space-y-1">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={cn(
                                "font-medium hover:bg-gray-100 px-3 py-2 rounded-md transition-colors",
                                // This highlights the link if the current path starts with its href
                                pathname.startsWith(link.href)
                                    ? "bg-gray-100 text-blue-600"
                                    : "text-gray-700"
                            )}
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* --- Main Content Area --- */}
            <main className="flex-1">
                {/* --- Header --- */}
                <header className="flex justify-end p-4 border-b bg-white">
                    {/* This component comes from Clerk and handles profile/logout */}
                    <UserButton />
                </header>

                {/* --- Page Content --- */}
                {/* p-8 adds padding around our page content */}
                <div className="p-8">{children}</div>
            </main>
        </div>
    );
}