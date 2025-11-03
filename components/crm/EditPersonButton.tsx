// Location: /components/crm/EditPersonButton.tsx
// --- IMPORT FIX APPLIED ---

"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
// --- THIS IS THE FIX ---
import { z } from "zod";
import { updatePersonSchema } from "@/lib/schemas";
// --- END FIX ---
import { updatePerson } from "@/lib/actions/crm.actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";

export function EditPersonButton({ person }: { person: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: z.infer<typeof updatePersonSchema>) => // <-- This was the line with the error
      updatePerson(person.id, values),
    onSuccess: (updatedPerson) => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({
        queryKey: ["company", updatedPerson.companyId],
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to update person:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: person.firstName,
      lastName: person.lastName || "",
      email: person.email || "",
      phone: person.phone || "",
      title: person.title || "",
    },
    onSubmit: async ({ value }) => {
      try {
        const validatedData = updatePersonSchema.parse(value);
        mutate(validatedData);
      } catch (error) {
        console.error("Validation error:", error);
      }
    }
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button variant="outline">Edit</Button>
      </Dialog.Trigger>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title>Edit {person.firstName}</Dialog.Title>
        <Dialog.Description className="text-gray-600 text-sm mt-2 mb-4">
          Make changes to this person's details here. Click save when you're done.
        </Dialog.Description>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* First Name */}
          <form.Field
            name="firstName"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>First Name</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <Text as="p" className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </Text>
                )}
              </div>
            )}
          />

          {/* Last Name */}
          <form.Field
            name="lastName"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Last Name</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />

          {/* Email */}
          <form.Field
            name="email"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Email</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <Text as="p" className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </Text>
                )}
              </div>
            )}
          />

          {/* Phone */}
          <form.Field
            name="phone"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Phone</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
              </div>
            )}
          />

          {/* Title */}
          <form.Field
            name="title"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Title</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., 'CTO', 'Head of Procurement'"
                />
              </div>
            )}
          />

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