// Location: /components/crm/CreateDealButton.tsx
"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { dealFormSchema } from "@/lib/schemas";
import { createDeal, getCompanies } from "@/lib/actions/crm.actions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STAGES = ["Discovery", "Proposal", "Negotiation", "Won", "Lost"] as const;
type Stage = (typeof STAGES)[number];

// --- UPDATED PROPS ---
export function CreateDealButton({ companyId }: { companyId?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ["companies"],
    queryFn: () => getCompanies(),
    // Only fetch if no companyId is provided
    enabled: !companyId,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createDeal,
    onSuccess: () => {
      // Invalidate both deals and the specific company details
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
      // --- UPDATE: Use the prop for the default value ---
      companyId: companyId || "",
      stage: "Discovery" as Stage,
      value: 0,
      closesAt: new Date().toISOString().split("T")[0],
    },
    onSubmit: async ({ value }) => {
      mutate(value);
    },
    validatorAdapter: zodValidator,
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>New Deal</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Deal Name (unchanged) */}
          <form.Field
            name="name"
            validators={{ onChange: dealFormSchema.shape.name }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Deal Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., 'Q4 Platform Contract'"
                />
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {/* --- UPDATE: Conditionally hide the Company select --- */}
          {!companyId && (
            <form.Field
              name="companyId"
              validators={{ onChange: dealFormSchema.shape.companyId }}
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Company</Label>
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
                    <p className="text-red-500 text-sm">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
                </div>
              )}
            />
          )}

          {/* Deal Value (unchanged) */}
          <form.Field
            name="value"
            validators={{ onChange: dealFormSchema.shape.value }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Value ($)</Label>
                <Input
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
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {/* Stage Select (unchanged) */}
          <form.Field
            name="stage"
            validators={{ onChange: dealFormSchema.shape.stage }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Stage</Label>
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

          {/* Closes At (unchanged) */}
          <form.Field
            name="closesAt"
            validators={{ onChange: dealFormSchema.shape.closesAt }}
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Estimated Close Date</Label>
                <Input
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

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}