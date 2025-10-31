// Location: /components/crm/ActivityForm.tsx
// --- NEW FILE ---

"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { eventFormSchema } from "@/lib/schemas";
import { createEvent } from "@/lib/actions/crm.actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// --- We need a simple Textarea component ---
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
// ---

type ActivityType = "Note" | "Call" | "Email" | "Task";

export function ActivityForm({ companyId }: { companyId: string }) {
  const [activeTab, setActiveTab] = useState<ActivityType>("Note");
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
      companyId: companyId,
      personId: undefined, // We'll leave these null for now
      dealId: undefined,
      type: "Note" as ActivityType,
      date: new Date().toISOString().split("T")[0], // Today
      content: "",
      isTask: false,
      isDone: false,
    },
    onSubmit: async ({ value }) => {
      mutate(value);
    },
    validatorAdapter: zodValidator,
  });

  // Helper to change tab
  const setTab = (tab: ActivityType) => {
    setActiveTab(tab);
    form.setFieldValue("type", tab);
    form.setFieldValue("isTask", tab === "Task");
  };

  // Tab Button styling
  const tabClass = (tab: ActivityType) =>
    cn(
      "px-4 py-2 font-medium rounded-t-md cursor-pointer",
      activeTab === tab
        ? "border-b-2 border-blue-600 text-blue-600"
        : "text-gray-500 hover:text-gray-700"
    );

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      {/* --- Tab Headers --- */}
      <div className="flex border-b border-gray-200 mb-4">
        <div className={tabClass("Note")} onClick={() => setTab("Note")}>Note</div>
        <div className={tabClass("Call")} onClick={() => setTab("Call")}>Call</div>
        <div className={tabClass("Email")} onClick={() => setTab("Email")}>Email</div>
        <div className={tabClass("Task")} onClick={() => setTab("Task")}>Task</div>
      </div>

      {/* --- Form --- */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        {/* Content Field */}
        <form.Field
          name="content"
          validators={{ onChange: eventFormSchema.shape.content }}
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {activeTab === 'Note' ? 'Your note...' :
                  activeTab === 'Call' ? 'Call summary...' :
                    activeTab === 'Email' ? 'Email content...' :
                      'Task details...'}
              </Label>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={
                  activeTab === "Task"
                    ? "e.g., Follow up with demo"
                    : "Log details..."
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

        {/* Date Field (for all types) */}
        <form.Field
          name="date"
          validators={{ onChange: eventFormSchema.shape.date }}
          children={(field) => (
            <div className="space-y-2">
              <Label htmlFor={field.name}>
                {activeTab === 'Task' ? 'Due Date' : 'Date'}
              </Label>
              <Input
                id={field.name}
                name={field.name}
                type="date"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </div>
          )}
        />

        {/* Hidden fields - TanStack Form handles them in defaultValues */}

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : `Save ${activeTab}`}
          </Button>
        </div>
      </form>
    </div>
  );
}