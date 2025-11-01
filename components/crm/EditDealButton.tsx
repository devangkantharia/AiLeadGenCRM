// Location: /components/crm/EditDealButton.tsx
// --- Allows editing deal name and value ---

"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDealSchema } from "@/lib/schemas";
import { updateDeal } from "@/lib/actions/crm.actions";

export function EditDealButton({ deal }: { deal: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: z.infer<typeof updateDealSchema>) => updateDeal(deal.id, values),
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
        </DialogHeader>
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
              <Label htmlFor={field.name}>Deal Name</Label>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors && (
                <p className="text-red-500 text-sm">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )} />
          <form.Field name="value" children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>Amount</Label>
              <Input
                id={field.name}
                name={field.name}
                type="number"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
              />
              {field.state.meta.errors && (
                <p className="text-red-500 text-sm">{field.state.meta.errors.join(", ")}</p>
              )}
            </div>
          )} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
