// Location: /lib/utils.ts
// This file is for utility functions, especially for Tailwind.

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}