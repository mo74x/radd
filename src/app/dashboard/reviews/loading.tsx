import React from 'react';
import { Card, Skeleton } from '@/components/ui';

export default function LoadingReviewsPage() {
  return (
    <div
      role="status"
      aria-label="Loading reviews list"
      className="mx-auto max-w-6xl space-y-6"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-border">
        <div className="space-y-2">
          <Skeleton variant="rounded" className="h-7 w-52" />
          <Skeleton variant="rounded" className="h-4 w-72" />
        </div>
        <Skeleton variant="rounded" className="h-10 w-36" />
      </div>

      {/* Filters Skeleton */}
      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <Skeleton variant="rounded" className="sm:col-span-2 lg:col-span-4 h-11" />
          <Skeleton variant="rounded" className="lg:col-span-2 h-11" />
          <Skeleton variant="rounded" className="lg:col-span-2 h-11" />
          <Skeleton variant="rounded" className="lg:col-span-2 h-11" />
          <Skeleton variant="rounded" className="lg:col-span-2 h-11" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <Skeleton variant="rounded" className="h-6 w-48" />
          <Skeleton variant="rounded" className="h-8 w-24" />
        </div>
      </Card>

      {/* Desktop Table Skeleton */}
      <Card className="hidden lg:block p-5 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-b-0"
          >
            <Skeleton variant="rounded" className="h-5 w-24" />
            <div className="flex items-center gap-2.5 w-44">
              <Skeleton variant="circular" className="w-8 h-8" />
              <Skeleton variant="rounded" className="h-4 w-28" />
            </div>
            <Skeleton variant="rounded" className="h-4 flex-1 max-w-md" />
            <Skeleton variant="rounded" className="h-5 w-14 rounded-full" />
            <Skeleton variant="rounded" className="h-5 w-20 rounded-full" />
            <Skeleton variant="rounded" className="h-5 w-28 rounded-full" />
            <Skeleton variant="rounded" className="h-4 w-16" />
          </div>
        ))}
      </Card>

      {/* Mobile Cards Skeleton */}
      <div className="lg:hidden space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton variant="circular" className="w-9 h-9" />
                <div className="space-y-1.5">
                  <Skeleton variant="rounded" className="h-4 w-32" />
                  <Skeleton variant="rounded" className="h-3 w-24" />
                </div>
              </div>
              <Skeleton variant="rounded" className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton variant="rounded" className="h-14 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
