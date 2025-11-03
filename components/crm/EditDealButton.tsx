// Location: /components/crm/EditDealButton.tsx
// --- Allows editing deal name and value ---

"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Flex, IconButton, Text, TextField } from "@radix-ui/themes";
import { updateDealSchema } from "@/lib/schemas";
import { updateDeal } from "@/lib/actions/crm.actions";
import { Pencil1Icon } from "@radix-ui/react-icons";

export function EditDealButton({ deal }: { deal: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    // --- FIX: Cast the values to the expected type for updateDeal ---
    mutationFn: (values: z.infer<typeof updateDealSchema>) => updateDeal(deal.id, values as { name: string; value: number }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["company", deal.companyId] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to update deal:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: deal.name,
      value: deal.value,
    },
    onSubmit: async ({ value }) => {
      try {
        const validated = updateDealSchema.parse(value);
        mutate(validated);
      } catch (error) {
        console.error("Validation error:", error);
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
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title>Edit Deal</Dialog.Title>
        <Dialog.Description className="text-gray-600 text-sm mt-2 mb-4">
          Make changes to your deal here. Click save when you're done.
        </Dialog.Description>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name" children={(field) => (
            <div className="space-y-2">
              <Text as="label" htmlFor={field.name}>Deal Name</Text>
              <TextField.Root
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <Text as="p" className="text-red-500 text-sm">{field.state.meta.errors.join(", ")}</Text>
              )}
            </div>
          )} />
          <form.Field name="value" children={(field) => (
            <div className="space-y-2">
              <Text as="label" htmlFor={field.name}>Amount</Text>
              <TextField.Root
                id={field.name}
                name={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.errors && (
                <Text as="p" className="text-red-500 text-sm">{field.state.meta.errors.join(", ")}</Text>
              )}
            </div>
          )} />

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Dialog.Close>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
