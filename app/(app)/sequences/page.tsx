// Location: /app/(app)/sequences/page.tsx
"use client";

import { Box, Flex, Heading, Text, useThemeContext } from "@radix-ui/themes";
import React from "react";

export default function SequencesPage() {

    const { accentColor: currentAccentColor, appearance } = useThemeContext();
    const isDarkMode = appearance === 'dark';

    return (
        <Box>
            <Flex justify={"between"} align={"baseline"} mb={"5"}>
                <Heading color={currentAccentColor} size="7">Email Sequences</Heading>
            </Flex>
            <Text as="p">This is where the email sequence builder (Blocknote) will go.</Text>
        </Box>
    );
}