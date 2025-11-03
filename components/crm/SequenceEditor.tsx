// Location: /components/crm/SequenceEditor.tsx
// --- NEW FILE ---

"use client";

import React, { useEffect, useState } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { type BlockNoteEditor, type PartialBlock } from "@blocknote/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertSequenceEmail } from "@/lib/actions/crm.actions";
import { Button, Text, TextField } from "@radix-ui/themes"
import { toast } from "sonner"; // We'll use this for save notifications

// This is the shape of the email we expect
type SequenceEmail = {
  id: string;
  day: number;
  subject: string;
  content: any; // This is the JSON from Blocknote
  sequenceId: string;
  ownerId: string;
};

export function SequenceEditor({ email }: { email: SequenceEmail }) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(email.subject || "");
  const [day, setDay] = useState(email.day || 1);
  const [isSaving, setIsSaving] = useState(false);

  // Initializes the Blocknote editor
  const editor: BlockNoteEditor = useCreateBlockNote();

  // This is the "Save" function
  const { mutate: saveEmail } = useMutation({
    mutationFn: async () => {
      setIsSaving(true);
      const contentJSON = editor.document; // Get the JSON content from the editor

      await upsertSequenceEmail({
        ...email,
        day,
        subject,
        content: contentJSON,
      });
    },
    onSuccess: () => {
      // Refresh the data on the page
      queryClient.invalidateQueries({
        queryKey: ["sequence", email.sequenceId],
      });
      toast.success("Email template saved!");
    },
    onError: (err) => {
      toast.error(`Error saving: ${err.message}`);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // This effect runs whenever the user clicks a *different* email
  // It loads the new email's content into the editor
  useEffect(() => {
    setSubject(email.subject || "");
    setDay(email.day || 1);
    // Safely replace the editor's content
    if (email.content && editor) {
      editor.replaceBlocks(editor.document, email.content as PartialBlock[]);
    } else if (editor) {
      // Or clear it if it's a new email
      editor.replaceBlocks(editor.document, []);
    }
  }, [email, editor]);

  return (
    <div className="bg-white rounded-lg shadow-md border p-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 space-y-2">
          <Text as={"label"} htmlFor="subject">Subject</Text>
          <TextField.Root
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your email subject"
          />
        </div>
        <div className="md:col-span-1 space-y-2">
          <Text as={"label"} htmlFor="day">Day</Text>
          <TextField.Root
            id="day"
            type="number"
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="mb-4">
        <Text as={"label"} className="block text-sm font-medium text-gray-700 mb-2">Content</Text>
        {/* This is the real Blocknote editor */}
        <div className="border rounded-md p-2">
          <BlockNoteView editor={editor} theme="light" />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => saveEmail()} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Email Template"}
        </Button>
      </div>
    </div>
  );
}