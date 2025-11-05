-- Add website column to Company table if it doesn't exist
-- Run this in Supabase SQL Editor

ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "website" TEXT;
