'use client';

import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between gap-5">
      <div className="flex items-center gap-4 w-full">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="space-y-2 flex-grow">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <Skeleton className="w-16 h-8 shrink-0" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm w-full">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-24 rounded-xl" />
      </div>
      <div className="p-6 space-y-4">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="flex items-center justify-between gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <Skeleton 
                key={cIdx} 
                className={`h-4 ${
                  cIdx === 0 ? 'w-16' : 
                  cIdx === 1 ? 'w-32' : 
                  cIdx === 2 ? 'w-24' : 
                  'w-12'
                }`} 
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4 w-full h-[320px]">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-20" />
      </div>
      <div className="flex-1 flex items-end justify-around gap-6 pt-4">
        <Skeleton className="w-12 h-[40%]" />
        <Skeleton className="w-12 h-[70%]" />
        <Skeleton className="w-12 h-[30%]" />
        <Skeleton className="w-12 h-[55%]" />
      </div>
    </div>
  );
}
