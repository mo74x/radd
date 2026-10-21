import React from 'react';
import { Card, Skeleton } from '@/components/ui';

export default function LoadingReviewDetail() {
  return (
    <div
      role="status"
      aria-label="Loading review details"
      className="mx-auto max-w-3xl space-y-5"
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="rounded" className="h-10 w-36" />
        <Skeleton variant="rounded" className="h-4 w-20" />
      </div>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-11 h-11" />
            <div className="space-y-2">
              <Skeleton variant="rounded" className="h-5 w-40" />
              <Skeleton variant="rounded" className="h-3.5 w-28" />
            </div>
          </div>
          <Skeleton variant="rounded" className="h-6 w-24" />
        </div>
        <Skeleton variant="rounded" className="h-24 w-full" />
      </Card>

      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <Skeleton variant="rounded" className="h-5 w-48" />
          <Skeleton variant="rounded" className="h-6 w-28 rounded-full" />
        </div>
        <Skeleton variant="rounded" className="h-28 w-full" />
      </Card>
    </div>
  );
}
