// Location: /app/(app)/people/page.tsx
"use client";

import React, { useState } from "react";
import { getPeople } from "@/lib/actions/crm.actions";
import { useQuery } from "@tanstack/react-query";
import { CreatePersonButton } from "@/components/crm/CreatePersonButton";
// --- 1. IMPORT THE NEW BUTTON ---
import { EditPersonButton } from "@/components/crm/EditPersonButton";
import { Box, Flex, Heading, Table, Text, useThemeContext, TextField, Card } from "@radix-ui/themes";

type PersonWithCompany = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  Company: {
    name: string;
  } | null;
};

export default function PeoplePage() {
  const {
    data: people,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["people"],
    queryFn: () => getPeople(),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  const filteredPeople =
    people?.filter((person: any) => {
      const searchTermLower = searchTerm.toLowerCase();
      const fullName =
        `${person.firstName || ""} ${person.lastName || ""}`.toLowerCase();
      const email = (person.email || "").toLowerCase();
      const companyName = (person.Company?.name || "").toLowerCase();
      const title = (person.title || "").toLowerCase();

      return (
        fullName.includes(searchTermLower) ||
        email.includes(searchTermLower) ||
        companyName.includes(searchTermLower) ||
        title.includes(searchTermLower)
      );
    }) || [];

  return (
    <Box>
      <Flex justify={"between"} align={"baseline"} mb={"5"}>
        <Heading color={currentAccentColor} size="7">People</Heading>
        <CreatePersonButton />
      </Flex>

      <Box className="mb-4">
        <TextField.Root
          placeholder="Search people by name, company, email, or title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </Box>

      {isLoading && <p>Loading people...</p>}
      {error && (
        <Text as="p" className="text-red-500">
          Error loading people: {(error as Error).message}
        </Text>
      )}

      {people && (
        <Card className="shadow rounded-lg">
          {filteredPeople.length === 0 ? (
            <Flex justify={"center"} className="h-64 p-28">
              <Text as="p" className="padding-4">
                {searchTerm ? "No people match your search" : "No people found"}
              </Text>
              {!searchTerm && (
                <Text as="p" className=" mt-2">
                  Create your first person to get started!
                </Text>
              )}
            </Flex>
          ) : (
            <Flex direction="column" gap="0">
              <Table.Root
                size={{ initial: "1", sm: "2" }}
              >
                <Table.Header className="">
                  <Table.Row>
                    <Table.ColumnHeaderCell className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `var(--accent-11)` }}>
                      Name
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `var(--accent-11)` }}>
                      Title
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `var(--accent-11)` }}>
                      Company
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: `var(--accent-11)` }}>
                      Email & Phone
                    </Table.ColumnHeaderCell>
                    {/* --- 2. ADD ACTION COLUMN HEADER --- */}
                    <Table.ColumnHeaderCell className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider" style={{ color: `var(--accent-11)` }}>
                      Actions
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body className="">
                  {filteredPeople.map((person: any) => (
                    <Table.Row key={person.id} className="">
                      <Table.Cell className="px-6 py-4 whitespace-nowrap" style={{ color: `var(--accent-9)`, fontWeight: 500, verticalAlign: 'middle' }}>
                        <div className="text-sm font-medium ">
                          {person.firstName} {person.lastName}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="px-6 py-4 whitespace-nowrap" style={{ color: `var(--accent-9)`, verticalAlign: 'middle' }}>
                        <div className="text-sm ">
                          {person.title || "N/A"}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="px-6 py-4 whitespace-nowrap" style={{ color: `var(--accent-9)`, verticalAlign: 'middle' }}>
                        <div className="text-sm ">
                          {person.Company?.name || "N/A"}
                        </div>
                      </Table.Cell>
                      <Table.Cell className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: `var(--accent-9)`, verticalAlign: 'middle' }}>
                        <div>{person.email || "N/A"}</div>
                        <div>{person.phone || "N/A"}</div>
                      </Table.Cell>
                      {/* --- 3. ADD THE EDIT BUTTON --- */}
                      <Table.Cell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" style={{ color: `var(--accent-9)`, verticalAlign: 'middle' }}>
                        <EditPersonButton person={person} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>



            </Flex>
          )}
        </Card>
      )}
    </Box>
  );
}