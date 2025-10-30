// Location: /components/crm/CreateCompanyButton.tsx
// This is a client component that combines the Button, Dialog, and Form

"use client";

import React, { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { companyFormSchema } from "@/lib/schemas";
import { createCompany } from "@/lib/actions/company.actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

// Import our reusable UI components
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

export function CreateCompanyButton() {
    const [isOpen, setIsOpen] = useState(false);
    const queryClient = useQueryClient();

    // Use TanStack Mutation for handling the server action
    const { mutate, isPending } = useMutation({
        mutationFn: createCompany,
        onSuccess: () => {
            // When the mutation is successful:
            // 1. Invalidate the "companies" query to refetch data
            queryClient.invalidateQueries({ queryKey: ["companies"] });
            // 2. Close the modal
            setIsOpen(false);
            // 3. Reset the form
            form.reset();
        },
        onError: (error) => {
            console.error("Failed to create company:", error);
            // We could add an error message toast here
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
        validatorAdapter: zodValidator,
    });

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>New Company</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create New Company</DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    className="space-y-4"
                >
                    {/* Company Name Field */}
                    <form.Field
                        name="name"
                        validators={{
                            onChange: companyFormSchema.shape.name,
                        }}
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Company Name</Label>
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

                    {/* Industry Field */}
                    <form.Field
                        name="industry"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Industry</Label>
                                <Input
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

                    {/* Size Field */}
                    <form.Field
                        name="size"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Company Size</Label>
                                <Input
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

                    {/* Geography Field */}
                    <form.Field
                        name="geography"
                        children={(field) => (
                            <div className="space-y-2">
                                <Label htmlFor={field.name}>Geography</Label>
                                <Input
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

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Saving..." : "Save Company"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}