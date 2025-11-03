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
import { Button, Card, Text, TextField, useThemeContext, Grid, Flex, Box } from "@radix-ui/themes"
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
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';

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
    <Card className={`rounded-lg shadow-md p-6 space-y-4  ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} >
      <Grid columns={{ initial: '1', md: '4' }} gap="4">
        <Flex direction="column" gap="2" className="md:col-span-3">
          <Text as="label" htmlFor="subject">Subject</Text>
          <TextField.Root
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your email subject"
          />
        </Flex>
        <Flex direction="column" gap="2" className="md:col-span-1">
          <Text as="label" htmlFor="day">Day</Text>
          <TextField.Root
            id="day"
            type="number"
            value={day}
            onChange={(e) => setDay(parseInt(e.target.value) || 1)}
          />
        </Flex>
      </Grid>

      <Box mb="4">
        <Text as="label" className="block text-sm mb-2">Content</Text>
        {/* This is the real Blocknote editor */}
        <Box className={`min-h-96 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-[#1f1f1f]' : 'border-gray-200 bg-[#ffffff]'}`}>
          <BlockNoteView editor={editor} theme={isDarkMode ? "dark" : "light"} className={`min-h-96 border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
        </Box>
      </Box>

      <Flex justify="end">
        <Button onClick={() => saveEmail()} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Email Template"}
        </Button>
      </Flex>
    </Card>
  );
}