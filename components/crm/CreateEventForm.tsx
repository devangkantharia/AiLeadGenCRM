// Location: /components/crm/CreateEventForm.tsx
// --- NEW FILE ---

"use client";

import React from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { eventFormSchema } from "@/lib/schemas";
import { createEvent } from "@/lib/actions/crm.actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

// Define the event types for the form
const EVENT_TYPES = ["Note", "Call", "Email", "Task"] as const;
type EventType = (typeof EVENT_TYPES)[number];

export function CreateEventForm({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createEvent,
    onSuccess: () => {
      // Invalidate the company details query to refetch events
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to create event:", error);
    },
  });

  const form = useForm({
    defaultValues: {
      type: "Note" as EventType,
      content: "",
      date: new Date().toISOString().split("T")[0],
      companyId: companyId,
    },
    onSubmit: async ({ value }) => {
      // We only pass the values, not the full schema
      mutate(value);
    },
    validatorAdapter: zodValidator,
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4 p-4 bg-white rounded-lg shadow border"
    >
      {/* Event Type */}
      <form.Field
        name="type"
        validators={{ onChange: eventFormSchema.shape.type }}
        children={(field) => (
          <div>
            <Label>Type</Label>
            <select
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value as EventType)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        )}
      />

      {/* Content */}
      <form.Field
        name="content"
        validators={{ onChange: eventFormSchema.shape.content }}
        children={(field) => (
          <div>
            <Label>Content</Label>
            <textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Log a call, add a note..."
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            {field.state.meta.errors && (
              <p className="text-red-500 text-sm">
                {field.state.meta.errors.join(", ")}
              </p>
            )}
          </div>
        )}
      />

      {/* Date */}
      <form.Field
        name="date"
        validators={{ onChange: eventFormSchema.shape.date }}
        children={(field) => (
          <div>
            <Label>Date</Label>
            <input
              id={field.name}
              name={field.name}
              type="date"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
        )}
      />

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Adding..." : "Add Activity"}
      </Button>
    </form>
  );
}