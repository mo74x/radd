import { Skeleton } from '@/components/ui';

export default function LoadingApproval() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 flex items-center justify-center">
      <div className="mx-auto max-w-lg w-full space-y-5 rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <div className="border-b border-border pb-4 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-48" />
        </div>

        <div className="rounded-xl bg-surface-raised p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-16 w-full" />
        </div>

        <div className="space-y-3 pt-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </main>
  );
}
