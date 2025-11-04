// Location: /components/crm/CreateCompanyButton.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
// --- REMOVED 'zodValidator' ---
import { companyFormSchema } from "@/lib/schemas";
import { createCompany } from "@/lib/actions/crm.actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";


export function CreateCompanyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to create company:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      industry: "",
      size: "",
      geography: "",
    },
    onSubmit: async ({ value }) => {
      mutate(value);
    },
    // --- THIS LINE IS REMOVED ---
    // validatorAdapter: zodValidator,
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button>New Company</Button>
      </Dialog.Trigger>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title>Create New Company</Dialog.Title>
        <Dialog.Description className="text-gray-600 text-sm mt-2 mb-4">
          Enter the details for the new company. Click save when you&apos;re done.
        </Dialog.Description>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field
            name="name"
            validators={{
              onChange: companyFormSchema.shape.name,
            }}
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Company Name</Text>
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

          <form.Field
            name="industry"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Industry</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., 'SaaS', 'E-commerce'"
                />
              </div>
            )}
          />

          <form.Field
            name="size"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Company Size</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., '1-10 employees'"
                />
              </div>
            )}
          />

          <form.Field
            name="geography"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Geography</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., 'London, UK'"
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
                {isPending ? "Saving..." : "Save Company"}
              </Button>
            </Dialog.Close>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}