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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  }, [pathname, router]);


  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/companies", label: "Companies" },
    { href: "/people", label: "People" },
    { href: "/deals", label: "Deals" },
    { href: "/sequences", label: "Email Sequences" },
  ];
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  return (
    <BreadcrumbContext.Provider value={{ childName, setChildName }}>
      <Flex style={{ minHeight: "100vh" }}>
        {/* Overlay for mobile when sidebar is open */}
        {isSidebarOpen && (
          <Box
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <Box
          p="1"
          className={`
            fixed h-screen z-30 transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            lg:translate-x-0 lg:static
          `}
          style={{ width: 256, flexShrink: 0 }}
        >
          <Card style={{ height: "100%", display: 'flex', flexDirection: 'column' }}>
            <Box style={{ flexGrow: 1 }}>
              <Flex justify="between" align="center" mb="6">
                <Heading color={currentAccentColor} size="6">AI Lead-Gen</Heading>
                {/* Close button for mobile - only visible when sidebar is open on mobile */}
                {isSidebarOpen && (
                  <Button
                    variant="ghost"
                    className="lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                    style={{ cursor: 'pointer' }}
                  >
                    ✕
                  </Button>
                )}
              </Flex>
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
                            onClick={() => setIsSidebarOpen(false)}
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

        {/* Main content area */}
        <Box className="flex-1  flex flex-col relative">
          {/* Top bar with hamburger and user button */}
          <Box className="flex-shrink-0 fixed top-0 left-0 right-0 z-10 bg-transparent">
            <Flex justify="between" align="center" p="2">
              {/* Hamburger menu button for mobile */}
              <Button
                variant="soft"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
                style={{ cursor: 'pointer' }}
              >
                ☰
              </Button>
              <Box className="flex-1" />
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
          {/* Page content */}
          <Box className="flex-grow p-4 lg:p-8 pt-16">
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