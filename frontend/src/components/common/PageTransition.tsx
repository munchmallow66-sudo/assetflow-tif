'use client';

import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps page content with a smooth fade-in-up entrance animation.
 * Use this as the outermost wrapper in each page component.
 */
export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div className={`animate-fade-in-up ${className}`}>
      {children}
    </div>
  );
}
