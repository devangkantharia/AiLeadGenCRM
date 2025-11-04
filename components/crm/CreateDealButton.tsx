// Location: /components/crm/CreateDealButton.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
// --- REMOVED 'zodValidator' ---
import { dealFormSchema } from "@/lib/schemas";
import { createDeal, getCompanies } from "@/lib/actions/crm.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

export function CreateDealButton({ companyId }: { companyId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getCompanies(),
    enabled: !companyId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to create deal:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      name: "",
      companyId: companyId || "",
      stage: "Discovery" as Stage,
      value: 0,
      closesAt: new Date().toISOString().split("T")[0],
    },
    onSubmit: async ({ value }) => {
      try {
        const validated = dealFormSchema.parse(value);
        mutate(validated);
      } catch (error) {
        console.error("Validation error:", error);
      }
    },
  });

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger>
        <Button>New Deal</Button>
      </Dialog.Trigger>
      <Dialog.Content className="sm:max-w-[425px]">
        <Dialog.Title>Create New Deal</Dialog.Title>
        <Dialog.Description className="text-gray-600 text-sm mt-2 mb-4">
          Enter the details for the new deal. Click save when you&apos;re done.
        </Dialog.Description>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Deal Name */}
          <form.Field
            name="name"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Deal Name</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., 'Q4 Platform Contract'"
                />
                {field.state.meta.errors && (
                  <Text as="p" className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </Text>
                )}
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

          {/* Deal Value */}
          <form.Field
            name="value"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Value ($)</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  type="number"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.valueAsNumber)
                  }
                />
                {field.state.meta.errors && (
                  <Text as="p" className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </Text>
                )}
              </div>
            )}
          />

          {/* Stage Select */}
          <form.Field
            name="stage"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Stage</Text>
                <select
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    field.handleChange(e.target.value as Stage)
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {STAGES.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage}
                    </option>
                  ))}
                </select>
              </div>
            )}
          />

          {/* Closes At */}
          <form.Field
            name="closesAt"
            children={(field) => (
              <div className="space-y-2">
                <Text as="label" htmlFor={field.name}>Estimated Close Date</Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    field.handleChange(e.target.value)
                  }
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
                {isPending ? "Saving..." : "Save Deal"}
              </Button>
            </Dialog.Close>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}