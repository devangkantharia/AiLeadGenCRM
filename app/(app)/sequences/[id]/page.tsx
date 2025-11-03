// Location: /app/(app)/sequences/[id]/page.tsx
// --- THIS IS THE REAL, WORKING BUILDER ---

"use client";

import {
  getSequenceDetails,
  upsertSequenceEmail,
  deleteSequenceEmail,
} from "@/lib/actions/crm.actions";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@radix-ui/themes"
import { SequenceEditor } from "@/components/crm/SequenceEditor";
import { useState, useEffect } from "react";
import { auth } from "@clerk/nextjs/server"; // We need this, but this is a client component...
// We'll get the ownerId from the query data instead
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  });

  // When data is fetched, select the first email by default
  useEffect(() => {
    if (sequenceData?.emails?.length > 0 && !selectedEmailId) {
      setSelectedEmailId(sequenceData.emails[0].id);
    }
  }, [sequenceData, selectedEmailId]);


  // 2. Mutation for creating a NEW email
  const { mutate: createNewEmail, isPending: isCreating } = useMutation({
    mutationFn: () => {
      if (!sequenceData?.sequence.ownerId) {
        throw new Error("Owner not found");
      }
      return upsertSequenceEmail({
        sequenceId: sequenceId,
        ownerId: sequenceData.sequence.ownerId, // Get owner from the sequence
        day: (sequenceData?.emails?.length || 0) + 1,
        subject: "New Email Subject",
        content: [{ type: "paragraph", content: "Start writing..." }],
      });
    },
    onSuccess: (newEmail) => {
      queryClient.invalidateQueries({ queryKey: ["sequence", sequenceId] });
      setSelectedEmailId(newEmail.id); // Auto-select the new email
      toast.success("New email step added!");
    },
  });

  // 3. Mutation for deleting an email
  const { mutate: deleteEmail } = useMutation({
    mutationFn: (emailId: string) => {
      if (window.confirm("Are you sure you want to delete this email?")) {
        return deleteSequenceEmail(emailId, sequenceId);
      }
      throw new Error("Delete cancelled");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequence", sequenceId] });
      setSelectedEmailId(null); // De-select
      toast.success("Email deleted.");
    },
    onError: (err) => {
      if (err.message !== "Delete cancelled") {
        toast.error(`Error: ${err.message}`);
      }
    },
  });

  // 4. Find the currently selected email from the fetched data
  const selectedEmail = sequenceData?.emails.find(
    (e) => e.id === selectedEmailId
  );

  if (isLoading) return <p>Loading sequence...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <h1 className="text-3xl font-bold">
        {sequenceData?.sequence.name}
      </h1>
      <p className="text-gray-600 mb-8">
        Build your multi-step email sequence.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1: Email list */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Emails</h2>
          <div className="space-y-2">
            {sequenceData?.emails.map((email: any) => (
              <div
                key={email.id}
                onClick={() => setSelectedEmailId(email.id)}
                className={cn(
                  "p-4 border rounded-lg cursor-pointer hover:bg-gray-50",
                  selectedEmailId === email.id
                    ? "bg-gray-100 border-blue-500"
                    : "bg-white"
                )}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Day {email.day}</h3>
                  <Button
                    variant="ghost"

                    className="text-red-500 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation(); // Don't trigger the select click
                      deleteEmail(email.id);
                    }}
                  >
                    Delete
                  </Button>
                </div>
                <p className="text-sm text-gray-500">{email.subject}</p>
              </div>
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
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          {selectedEmail ? (
            <SequenceEditor email={selectedEmail as any} />
          ) : (
            <div className="h-96 flex items-center justify-center bg-white border rounded-lg shadow-md">
              <p className="text-gray-500">
                Select an email to edit or add a new one.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}