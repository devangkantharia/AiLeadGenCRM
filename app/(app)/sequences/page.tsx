// Location: /app/(app)/sequences/page.tsx
"use client";

import { getEmailSequences, createEmailSequence } from "@/lib/actions/crm.actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Box, Button, Card, Dialog, Flex, Heading, Text, TextField, useThemeContext } from "@radix-ui/themes";
import { useState } from 'react';
import { EditSequenceButton } from "@/components/crm/EditSequenceButton";
import { toast } from "sonner";
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
            toast.success("New sequence created!");
        },
        onError: (err) => {
            toast.error(`Error: ${(err as Error).message}`);
        }
    });


    return (
        <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
            <Dialog.Trigger>
                <Button size="3">New Sequence</Button>
            </Dialog.Trigger>

            <Dialog.Content style={{ maxWidth: 450 }}>
                <Dialog.Title>Create New Email Sequence</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Give your new sequence a name.
                </Dialog.Description>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        mutate(name);
                    }}
                >
                    <Flex direction="column" gap="3">
                        <label>
                            <Text as="div" size="2" mb="1" weight="bold">
                                Name
                            </Text>
                            <TextField.Root
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., 'SaaS Cold Outreach'"
                                required
                            />
                        </label>
                    </Flex>

                    <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                            <Button variant="soft" color="gray">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Creating..." : "Create Sequence"}
                        </Button>
                    </Flex>
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
                            <Card className="shadow-lg hover:shadow-lg transition-shadow hover:ring-2 hover:ring-blue-500">
                                <Flex justify="between" align="start" className="flex-grow pb-14">
                                    <Heading as="h3" size="4" className="font-semibol truncate pr-2" color={currentAccentColor}>
                                        {seq.name}
                                    </Heading>
                                    <Box onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                                        <EditSequenceButton sequence={seq} />
                                    </Box>
                                </Flex>
                                <Text style={{ color: `var(--accent-11)` }} as="p" size="1">
                                    Created: {new Date(seq.createdAt).toLocaleDateString()}
                                </Text>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </Box>
    );
}