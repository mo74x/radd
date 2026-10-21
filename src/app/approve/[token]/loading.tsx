import { Skeleton } from '@/components/ui';

export default function LoadingApproval() {
  return (
    <main className="min-h-screen bg-background px-3.5 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-[420px] flex flex-col gap-4">
        <div className="flex items-center justify-between pb-3">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-10 w-14 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-xl" />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="border-b border-border-muted pb-3 space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Skeleton className="h-5 w-28" />
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3 shadow-xs">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        <div className="space-y-2.5 pt-1">
          <Skeleton className="h-13 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </main>
  );
}
