// Location: /components/crm/ActivityForm.tsx
// --- VALIDATORADAPTER LINE REMOVED ---

"use client";
import React, { useState, useMemo } from "react";
import { useForm } from "@tanstack/react-form";
// --- REMOVED 'zodValidator' ---
import { eventFormSchema } from "@/lib/schemas";
import { createEvent } from "@/lib/actions/crm.actions"; // <-- This import will now work
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Box, Button, Card, Flex, Text, TextField, useThemeContext } from "@radix-ui/themes";

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

type ActivityType = "Note" | "Call" | "Email" | "Task";

export function ActivityForm({ companyId }: { companyId: string }) {
  const [activeTab, setActiveTab] = useState<ActivityType>("Note");
  const { accentColor: currentAccentColor, appearance } = useThemeContext();
  const isDarkMode = appearance === 'dark';
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createEvent, // <-- This will now resolve
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Failed to create event:", error);
    },
  });

  const form = useForm({
    // By using useMemo, the defaultValues will be re-evaluated when activeTab changes.
    // This ensures form.reset() uses the correct default 'type' for the current tab.
    defaultValues: useMemo(() => ({
      companyId: companyId,
      personId: undefined,
      dealId: undefined,
      type: activeTab,
      date: new Date().toISOString().split("T")[0],
      content: "",
      isTask: activeTab === "Task",
      isDone: false,
    }), [activeTab, companyId]),
    onSubmit: async ({ value }) => {
      mutate(value); // <-- This will now work
    },
    // --- THIS LINE IS REMOVED TO FIX THE CRASH ---
    // validatorAdapter: zodValidator,
  });

  const setTab = (tab: ActivityType) => {
    setActiveTab(tab);
    form.setFieldValue("type", tab);
    form.setFieldValue("isTask", tab === "Task");
  };

  const tabClass = (tab: ActivityType) =>
    cn(
      "px-4 py-2 font-medium rounded-t-md cursor-pointer",
      activeTab === tab
        ? `border-b-2`
        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
    );

  return (
    <Card asChild className="h-full transition-shadow hover:shadow-lg hover:ring-2 hover:ring-blue-500">
      <Box height={"auto"}>
        {/* Tabs */}
        <Flex className={`border-b mb-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
          {(["Note", "Call", "Email", "Task"] as ActivityType[]).map((tab) => (
            <Box
              key={tab}
              className={tabClass(tab)}
              style={activeTab === tab ? { borderColor: `var(--${currentAccentColor}-9)` } : {}}
              onClick={() => setTab(tab)}
            >
              <Text color={activeTab === tab ? currentAccentColor : undefined} weight="medium">{tab}</Text>
            </Box>
          ))}
        </Flex>

        {/* Form */}
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
            // --- FIX: Validate onBlur instead of onChange ---
            // This prevents validation errors from appearing while the user is typing.
            validators={{
              onBlur: ({ value }) => {
                // The field is optional, so an empty string is valid.
                if (!value) return undefined;

                // If the field is not empty, validate it against the schema.
                const result = eventFormSchema.shape.content.safeParse(value);
                return result.success ? undefined : result.error.formErrors.formErrors.join(', ');
              },
            }}
            children={(field) => (
              <Box className="space-y-2">
                <Text as="label" size="2" weight="medium" color={currentAccentColor} htmlFor={field.name}>
                  {activeTab === 'Note' ? 'Your note...' :
                    activeTab === 'Call' ? 'Call summary...' :
                      activeTab === 'Email' ? 'Email content...' :
                        'Task details...'}
                </Text>
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
                  color={currentAccentColor}
                  className={`p-5 rounded-lg shadow-md hover:shadow-lg transition-shadow border hover:border-blue-500 h-full ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}
                />
                {field.state.meta.errors && (
                  <Text as="p" className="text-red-500 text-sm">
                    {field.state.meta.errors.join(", ")}
                  </Text>
                )}
              </Box>
            )}
          />

          {/* Date Field */}
          <form.Field
            name="date"
            // --- FIX: Correctly implement the date validator ---
            // This was the source of the remaining `props.validate` error.
            validators={{
              onChange: ({ value }) =>
                eventFormSchema.shape.date.safeParse(value).error?.formErrors.formErrors.join(', '),
            }}
            children={(field) => (
              <Box className="space-y-2">
                <Text as="label" size="2" weight="medium" color={currentAccentColor} htmlFor={field.name}>
                  {activeTab === 'Task' ? 'Due Date' : 'Date'}
                </Text>
                <TextField.Root
                  id={field.name}
                  name={field.name}
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  style={{ maxWidth: 140 }}
                />
              </Box>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : `Save ${activeTab}`}
            </Button>
          </div>
        </form>
      </Box>
    </Card>
  );
}