"use client";

import { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';

interface BreadcrumbContextType {
  childName: string | null;
  setChildName: Dispatch<SetStateAction<string | null>>;
}

export const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const useBreadcrumb = () => useContext(BreadcrumbContext);