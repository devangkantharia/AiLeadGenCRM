// Location: /app/(app)/sequences/page.tsx
"use client";

import { getEmailSequences, createEmailSequence } from "@/lib/actions/crm.actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Box, Button, Dialog, Flex, Heading, Text, TextField, useThemeContext } from "@radix-ui/themes";
import { useState } from "react";
function CreateSequenceButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const queryClient = useQueryClient();

    const { mutate, isPending } = useMutation({
        mutationFn: createEmailSequence,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sequences"] });
            setIsOpen(false);
            setName("");
        },
    });

    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger>
                <Button>New Sequence</Button>
            </Dialog.Trigger>
            <Dialog.Content className="sm:max-w-[425px]">
                <Dialog.Title>Create New Email Sequence</Dialog.Title>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        mutate(name);
                    }}
                    className="space-y-4"
                >
                    <TextField.Root
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., 'SaaS Cold Outreach'"
                        required
                    />
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Create Sequence"}
                    </Button>
                </form>
            </Dialog.Content>
        </Dialog.Root>
    );
}

export default function SequencesPage() {
    const { accentColor: currentAccentColor, appearance } = useThemeContext();
    const isDarkMode = appearance === 'dark';
    const {
        data: sequences,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["sequences"],
        queryFn: () => getEmailSequences(),
    });

    return (
        <Box>
            <Flex justify={"between"} align={"baseline"} mb={"5"}>
                <Heading color={currentAccentColor} size="7">Email Sequences</Heading>
                <CreateSequenceButton />
            </Flex>

            {isLoading && <p>Loading sequences...</p>}
            {error && (
                <p className="text-red-500">
                    Error loading sequences: {(error as Error).message}
                </p>
            )}

            {sequences && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sequences.length === 0 && (
                        <p className="text-gray-500 col-span-full text-center">
                            No sequences found. Create one to get started!
                        </p>
                    )}
                    {sequences.map((seq: any) => (
                        <Link
                            key={seq.id}
                            href={`/sequences/${seq.id}`}
                            className="block p-0"
                        >
                            <div className="bg-white p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-transparent hover:border-blue-500 h-32 flex flex-col justify-between">
                                <h3 className="text-xl font-semibold text-blue-600 truncate">
                                    {seq.name}
                                </h3>
                                <p className="text-sm text-gray-400">
                                    Created: {new Date(seq.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </Box>
    );
}