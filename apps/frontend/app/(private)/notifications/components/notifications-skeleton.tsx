export function NotificationsSkeleton() {
    return (
        <div className="flex flex-col gap-4 p-6" data-testid="notifications-skeleton">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
            <div className="h-12 w-full animate-pulse rounded-lg bg-muted md:w-74" />
            <div className="h-96 animate-pulse rounded-lg bg-muted" />
        </div>
    );
}
