// Location: /components/crm/CreatePersonButton.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
// --- REMOVED 'zodValidator' ---
import { personFormSchema } from "@/lib/schemas";
import { createPerson, getCompanies } from "@/lib/actions/crm.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";

export function CreatePersonButton({ companyId }: { companyId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getCompanies(),
    enabled: !companyId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createPerson,
    onSuccess: () => {
      // Invalidate the 'people' query to refetch the list on the People page
      queryClient.invalidateQueries({ queryKey: ["people"] });
      // Invalidate the current company's data to show the new person in the list
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to create person:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      title: "",
      companyId: companyId || "",
    },
    onSubmit: async ({ value }) => {
      try {
        const validated = personFormSchema.parse(value);
        mutate(validated);
      } catch (error) {
        console.error("Validation error:", error);
      }
    },
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button>New Person</Button>
      </Dialog.Trigger>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title>Create New Person</Dialog.Title>
        <Dialog.Description className="text-gray-600 text-sm mt-2 mb-4">
          Enter the details for the new person. Click save when you&apos;re done.
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

          {/* Company Select */}
          {!companyId && (
            <form.Field
              name="companyId"
              children={(field) => (
                <div className="space-y-2">
                  <Text as="label" htmlFor={field.name}>Company</Text>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                      field.handleChange(e.target.value)
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isLoadingCompanies}
                  >
                    <option value="" disabled>
                      {isLoadingCompanies
                        ? "Loading companies..."
                        : "Select a company"}
                    </option>
                    {companies?.map((company: any) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {field.state.meta.errors && (
                    <Text as="p" className="text-red-500 text-sm">
                      {field.state.meta.errors.join(", ")}
                    </Text>
                  )}
                </div>
              )}
            />
          )}

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button type="button" variant="soft">
                Cancel
              </Button>
            </Dialog.Close>
            <Dialog.Close>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : "Save Person"}
              </Button>
            </Dialog.Close>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}