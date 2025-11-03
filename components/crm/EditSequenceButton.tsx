"use client";

import {
  updateEmailSequence,
  deleteEmailSequence,
} from "@/lib/actions/crm.actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Button,
  Dialog,
  Flex,
  Text,
  TextField,
  IconButton,
} from "@radix-ui/themes";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil1Icon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";

export function EditSequenceButton({ sequence }: { sequence: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(sequence.name);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { mutate: updateSequence, isPending: isUpdating } = useMutation({
    mutationFn: () => updateEmailSequence(sequence.id, name),
    onSuccess: () => {
      // Invalidate both the list of all sequences and the specific sequence detail
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      queryClient.invalidateQueries({ queryKey: ["sequence", sequence.id] });

      toast.success("Sequence renamed!");
      setIsOpen(false);
    },
    onError: (err) => {
      toast.error(`Error: ${(err as Error).message}`);
    },
  });

  const { mutate: deleteSequence, isPending: isDeleting } = useMutation({
    mutationFn: () => {
      if (!window.confirm("Are you sure you want to delete this sequence? This action cannot be undone.")) {
        throw new Error("Delete cancelled");
      }
      return deleteEmailSequence(sequence.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sequences"] });
      toast.success("Sequence deleted.");
      setIsOpen(false);
      // Optional: redirect if the user is on the deleted sequence's page
      // This component is on the list page, so not strictly necessary here.
    },
    onError: (err) => {
      if ((err as Error).message !== "Delete cancelled") {
        toast.error(`Error: ${(err as Error).message}`);
      }
    },
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <IconButton variant="ghost" size="1">
          <Pencil1Icon />
        </IconButton>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Edit Sequence</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Rename or delete your sequence.
        </Dialog.Description>

        <form>
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

          <Flex gap="3" mt="4" justify="between">
            <Button color="red" variant="soft" disabled={isDeleting} onClick={() => deleteSequence()}>
              {isDeleting ? "Deleting..." : "Delete Sequence"}
            </Button>
            <Flex gap="3" justify="end">
              <Dialog.Close><Button variant="soft" color="gray">Cancel</Button></Dialog.Close>
              <Button
                disabled={isUpdating}
                onClick={(e) => {
                  e.preventDefault(); // Prevent default form submission
                  updateSequence();
                }}
              >
                {isUpdating ? "Saving..." : "Save Changes"}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
