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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit {person.firstName}</DialogTitle>
        </DialogHeader>

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
                <Label htmlFor={field.name}>First Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {/* Last Name */}
          <form.Field
            name="lastName"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Last Name</Label>
                <Input
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
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors && (
                  <p className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {/* Phone */}
          <form.Field
            name="phone"
            children={(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Phone</Label>
                <Input
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
                <Label htmlFor={field.name}>Title</Label>
                <Input
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

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}