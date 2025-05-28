"use client";

import React from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface ResponsiveLayoutProps {
  desktopComponent: React.ReactNode;
  mobileComponent: React.ReactNode;
  breakpoint?: string;
}

export function ResponsiveLayout({
  desktopComponent,
  mobileComponent,
  breakpoint = "(min-width: 768px)"
}: ResponsiveLayoutProps) {
  const isDesktop = useMediaQuery(breakpoint);
  
  return (
    <>
      {isDesktop ? desktopComponent : mobileComponent}
    </>
  );
}
