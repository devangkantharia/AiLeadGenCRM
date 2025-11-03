// Location: /app/(app)/layout.tsx
// This layout wraps all our *protected* pages (dashboard, companies, etc.)

"use client"; // Required for pathname hook

import { UserButton } from "@clerk/nextjs";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Box, Flex, Card, Text, Heading, useThemeContext } from "@radix-ui/themes";
import { ThemesPanelBackgroundImage } from "@/components/ThemesPanelBackgroundImage";

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
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  return (
    <Flex style={{ minHeight: "100vh" }}>
      {/* --- Sidebar --- */}
      <Box style={{ width: 256, minHeight: "100vh", padding: 16, borderRight: '1px solid ' }}>
        <aside>
          <Heading color={currentAccentColor} size="6" mb="6">AI Lead-Gen</Heading>
          <nav>
            <Flex direction="column" gap="2" style={{ listStyle: 'none', padding: 0 }}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link href={link.href} passHref legacyBehavior>
                      <Box
                        p="2"
                        onMouseOver={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-3)'}
                        onMouseOut={(e) => e.currentTarget.style.boxShadow = isActive ? 'var(--shadow-3)' : 'none'}
                        style={{
                          display: 'block',
                          borderRadius: 'var(--radius-3)',
                          backgroundColor: isActive ? `var(--${currentAccentColor}-a4)` : 'transparent',
                          color: isActive ? `var(--${currentAccentColor}-11)` : `var(--${currentAccentColor}-10)`,
                          border: `1px solid ${isActive ? `var(--blue-7)` : 'transparent'}`,
                          boxShadow: isActive ? 'var(--shadow-3)' : 'none',
                          transition: 'background-color 150ms, box-shadow 150ms',
                          cursor: 'pointer',
                        }}
                      >{link.label}</Box>
                    </Link>
                  </li>
                );
              })}
            </Flex>
          </nav>
        </aside>
      </Box>

      {/* --- Main Content Area --- */}
      <Box style={{ flex: 1, position: 'relative' }}>
        <Flex justify="end" align="center" style={{ position: 'fixed', top: '0rem', right: '0rem', zIndex: 10, padding: '5px' }}>
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: {
                  width: "40px",
                  height: "40px",
                },
              },
            }} />
        </Flex>

        {/* --- Page Content --- */}
        <Box p="8" style={{ height: '100vh', overflowY: 'auto' }}>
          {children}
          <Flex
            align="center"
            justify="center"
            overflow="hidden"
            position="absolute"
            style={{ zIndex: -1 }}
            inset="0"
          >
            <ThemesPanelBackgroundImage
              id="1"
              width="2000px"
              height="2000px"
            />
          </Flex>
        </Box>
      </Box>
    </Flex>
  );
}