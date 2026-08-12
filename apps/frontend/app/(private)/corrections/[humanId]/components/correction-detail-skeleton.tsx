export function CorrectionDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 pt-5 md:p-8" data-testid="correction-detail-skeleton">
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="h-48 animate-pulse rounded-lg bg-muted" />
      <div className="h-32 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}
