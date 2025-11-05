// Location: /app/(app)/companies/page.tsx
"use client";

import { getCompanies } from "@/lib/actions/crm.actions"; // Corrected import
import { useQuery } from "@tanstack/react-query";
import { CreateCompanyButton } from "@/components/crm/CreateCompanyButton";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card, Flex, Heading, Text, Box, useThemeContext, Grid, Badge } from "@radix-ui/themes";
import { DecorativeBox, ThemesVolumeControlExample } from "@/components/ThemesDocsAssets";
import { Company } from "@prisma/client";
import { getStatusBadgeColor } from "@/lib/stageColors";

export default function CompaniesPage() {
  const {
    data: companies,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => getCompanies(),
  });
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

  return (
    <Box>
      <Flex justify={"between"} align={"baseline"} mb={"5"}>
        <Heading color={currentAccentColor} size="7">Companies</Heading>
        <CreateCompanyButton />
      </Flex>

      {isLoading && <p>Loading companies...</p>}

      {error && (
        <Box as="div" className="text-red-500">
          Error loading companies: {(error as Error).message}
        </Box>
      )}

      {companies && (
        <>
          {companies.length === 0 ? (
            <Flex justify={"center"} align={"center"} className="h-64 rounded-lg shadow border">
              <h3 className="text-xl font-semibold">No companies found</h3>
              <Text as="p" className="text-gray-500 mt-2">
                Create your first company to get started!
              </Text>
            </Flex>
          ) : (
            <Grid columns={{ initial: "1", md: "3" }} gap="3" width="auto">
              {companies.map((company: any) => (
                <Link
                  key={company.id}
                  href={`/companies/${company.id}`}
                  className="block p-0"
                  passHref
                >
                  <Card className="h-full transition-shadow hover:shadow-lg hover:ring-2 hover:ring-blue-500">
                    <Grid columns={{ initial: "1", lg: "7fr 3fr" }} gap="3" width="auto" p="3">
                      <Box>
                        <Heading size={"4"} className="font-semibold truncate" color={currentAccentColor}>
                          {company.name}
                        </Heading>
                        <Box className="mt-2 text-sm space-y-1">
                          <Box>
                            <Text style={{ color: `var(--accent-11)` }} as="span" weight="medium">Industry: </Text>
                            <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{company.industry || "N/A"}</Text>
                          </Box>
                          <Box>
                            <Text style={{ color: `var(--accent-11)` }} as="span" weight="medium">Size: </Text>
                            <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{company.size || "N/A"}</Text>
                          </Box>
                          <Box>
                            <Text style={{ color: `var(--accent-11)` }} as="span" weight="medium">Location: </Text>
                            <Text style={{ color: `var(--accent-8)` }} as="span" weight="regular">{company.geography || "N/A"}</Text>
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        <Text style={{ color: `var(--accent-11)` }} as="div" weight="medium">Deals ({company.deals?.length || 0})</Text>
                        <Flex direction="row" wrap="wrap" gap="1" mt="2">
                          {company.deals && company.deals.length > 0 ? (
                            company.deals.map((deal: any) => (
                              <Box key={deal.id} style={{ maxWidth: '100px' }}>
                                <Badge color={getStatusBadgeColor(deal.stage)} style={{ width: '100%' }}>
                                  {deal.stage}
                                </Badge>
                              </Box>
                            ))
                          ) : (
                            <Text style={{ color: `var(--accent-8)` }} as="span" size="1" weight="regular">No deals</Text>
                          )}
                        </Flex>
                      </Box>
                    </Grid>
                  </Card>
                </Link>
              ))}
            </Grid>
          )}
        </>
      )}
    </Box>
  );
}