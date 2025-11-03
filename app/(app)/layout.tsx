// Location: /app/(app)/layout.tsx
// This layout wraps all our *protected* pages (dashboard, companies, etc.)

"use client"; // Required for pathname hook
import { BreadcrumbContext } from "@/components/crm/BreadcrumbContext";

import { UserButton } from "@clerk/nextjs";
import React, { useState, useEffect } from "react";
import Link from "next/link"; import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Box, Flex, Card, Text, Heading, useThemeContext, Kbd, ThemePanel, Button } from "@radix-ui/themes";
import { ThemesPanelBackgroundImage } from "@/components/ThemesPanelBackgroundImage";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [childName, setChildName] = useState<string | null>(null);
  const handleToggleThemePanel = () => {
    // This creates a fake "T" key press event
    const event = new KeyboardEvent('keydown', {
      key: 't',
      bubbles: true, // Allows the event to bubble up to the document
    });
    // This sends the fake event to the document,
    // which the <ThemePanel> is listening for.
    document.dispatchEvent(event);
  };

  // Reset childName when navigating to a new top-level page
  useEffect(() => {
    setChildName(null);
  }, [pathname]);

  // Force a re-render on browser back/forward navigation
  useEffect(() => {
    router.refresh();
  }, [pathname]);


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
    <BreadcrumbContext.Provider value={{ childName, setChildName }}>
      <Flex style={{ minHeight: "100vh" }}>
        <Box
          p="1"
          style={{ width: 256, flexShrink: 0, position: 'fixed', height: '100vh' }}
          className="abc"
        >
          <Card style={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
            <Box style={{ flexGrow: 1 }}>
              <Heading color={currentAccentColor} size="6" mb="6">AI Lead-Gen</Heading>
              <nav>
                <Flex direction="column" gap="2" style={{ listStyle: 'none', padding: 0 }}>
                  {navLinks.map((link) => {
                    // Highlight parent nav link on child pages
                    const isActive = link.href === '/dashboard'
                      ? pathname === link.href
                      : pathname.startsWith(link.href);

                    const truncatedChildName = childName && childName.length > 8
                      ? `${childName.substring(0, 8)}…`
                      : childName;
                    const displayLabel = isActive && truncatedChildName && pathname !== link.href
                      ? `${link.label} > ${truncatedChildName}`
                      : link.label;

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
                          >{displayLabel}</Box>
                        </Link>
                      </li>
                    );
                  })}
                </Flex>
              </nav>
            </Box>
            <Box style={{ flexShrink: 0, paddingBottom: '10px' }}>
              <Button
                onClick={handleToggleThemePanel}
                style={{
                  cursor: 'pointer'
                }}
                variant="soft"
              >Theme Toggle Panel</Button>
            </Box>
          </Card>
        </Box>

        <Box style={{ flex: 1, marginLeft: 256, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <Box style={{ flexShrink: 0, position: 'fixed', top: 0, right: 10, zIndex: 10 }}>
            <Flex justify="end" align="center" p="2">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: {
                      width: "40px",
                      height: "40px",
                    },
                  },
                }}
              />
            </Flex>
          </Box>
          <Box p="8" style={{ flexGrow: 1, position: 'relative' }}>
            {children}
          </Box>
        </Box>
      </Flex>
      <Flex
        align="center"
        justify="center"
        overflow="hidden"
        style={{ position: 'fixed', zIndex: -1, inset: '0' }}
      >
        <ThemesPanelBackgroundImage id="1" width="2000px" height="2000px" />
      </Flex>
      <ThemePanel defaultOpen={false} />
    </BreadcrumbContext.Provider>
  );
}