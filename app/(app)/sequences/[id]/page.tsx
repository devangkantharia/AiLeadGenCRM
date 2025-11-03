// Location: /app/(app)/sequences/[id]/page.tsx
// --- REWRITTEN FOR RADIX THEMES & v5 useQuery ---

"use client";

import {
  getSequenceDetails,
  upsertSequenceEmail,
  deleteSequenceEmail,
} from "@/lib/actions/crm.actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SequenceEditor } from "@/components/crm/SequenceEditor";
// --- 1. Import useEffect ---
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";

type SequenceEmail = {
  id: string;
  day: number;
  subject: string;
  content: any;
  sequenceId: string;
  ownerId: string;
};

export default function SequenceBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const sequenceId = params.id;
  const queryClient = useQueryClient();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  // 1. Fetch the sequence folder and all its emails
  const {
    data: sequenceData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sequence", sequenceId],
    queryFn: () => getSequenceDetails(sequenceId),
    // --- 2. THE 'onSuccess' CALLBACK IS REMOVED ---
  });

  // --- 3. THIS IS THE v5 FIX ---
  // We use useEffect to react to data changes
  useEffect(() => {
    if (sequenceData?.emails?.length > 0 && !selectedEmailId) {
      setSelectedEmailId(sequenceData.emails[0].id);
    }
  }, [sequenceData, selectedEmailId]);
  // --- END FIX ---

  // 2. Mutation for creating a NEW email (no change)
  const { mutate: createNewEmail, isPending: isCreating } = useMutation({
    mutationFn: () => {
      if (!sequenceData?.sequence.ownerId) {
        throw new Error("Owner not found");
      }
      return upsertSequenceEmail({
        sequenceId: sequenceId,
        ownerId: sequenceData.sequence.ownerId,
        day: (sequenceData?.emails?.length || 0) + 1,
        subject: "New Email Subject",
        content: [{ type: "paragraph", content: "Start writing..." }],
      });
    },
    onSuccess: (newEmail) => {
      queryClient.invalidateQueries({ queryKey: ["sequence", sequenceId] });
      setSelectedEmailId(newEmail.id);
      toast.success("New email step added!");
    },
  });

  // 3. Mutation for deleting an email (no change)
  const { mutate: deleteEmail } = useMutation({
    mutationFn: (emailId: string) => {
      if (window.confirm("Are you sure you want to delete this email?")) {
        return deleteSequenceEmail(emailId, sequenceId);
      }
      throw new Error("Delete cancelled");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequence", sequenceId] });
      setSelectedEmailId(null);
      toast.success("Email deleted.");
    },
    onError: (err) => {
      if ((err as Error).message !== "Delete cancelled") {
        toast.error(`Error: ${(err as Error).message}`);
      }
    },
  });

  // 4. Find the currently selected email (no change)
  const selectedEmail = sequenceData?.emails.find(
    (e) => e.id === selectedEmailId
  );

  if (isLoading) return <p>Loading sequence...</p>;
  if (error) return <p>Error: {(error as Error).message}</p>;

  return (
    <Box className="space-y-8">
      <Text as="div" size="2" mb="4">
        <Link href="/sequences" style={{ color: `var(--accent-11)` }} className="hover:underline">&larr; Back to all sequences</Link>
      </Text>
      <Heading as="h1" size="7" className="!mb-2">
        {sequenceData?.sequence.name}
      </Heading>
      <Text as="p" size="3" color="gray" className="!mt-2 !mb-8">
        Build your multi-step email sequence.
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Email list */}
        <div className="md:col-span-1">
          <Heading as="h2" size="5" mb="4">Emails</Heading>
          <div className="space-y-2">
            {sequenceData?.emails.map((email: SequenceEmail) => (
              <Box
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer hover:bg-gray-50",
                  selectedEmailId === email.id
                    ? "bg-gray-100 border-blue-500 ring-2 ring-blue-500"
                    : "bg-white"
                )}
              >
                <Flex justify="between" align="center">
                  <Heading as="h3" size="3">Day {email.day}</Heading>
                  <Button
                    variant="ghost"
                    color="red"
                    size="1"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEmail(email.id);
                    }}
                  >
                    Delete
                  </Button>
                </Flex>
                <Text as="p" size="2" color="gray" className="truncate">{email.subject}</Text>
              </Box>
            ))}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => createNewEmail()}
              disabled={isCreating}
            >
              {isCreating ? "Adding..." : "+ Add Email Step"}
            </Button>
          </div>
        </div>

        {/* Column 2: Editor */}
        <div className="md:col-span-2">
          {selectedEmail ? (
            <SequenceEditor email={selectedEmail as any} />
          ) : (
            <Flex
              align="center"
              justify="center"
              className="h-96 bg-white border rounded-lg shadow-md"
            >
              <Text color="gray">
                {sequenceData?.emails.length === 0
                  ? "Add your first email step to begin."
                  : "Select an email to edit."}
              </Text>
            </Flex>
          )}
        </div>
      </div>
    </Box>
  );
}