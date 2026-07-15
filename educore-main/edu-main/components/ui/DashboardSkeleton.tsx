/**
 * Reusable skeleton building blocks for loading states.
 * Use these inside components that fetch data asynchronously.
 *
 * All skeletons have fixed min-heights to prevent CLS.
 */

export const CardSkeleton = ({ className = "" }: { className?: string }) => (
    <div className={`rounded-2xl bg-muted/15 border border-border/10 animate-pulse skeleton-card ${className}`} />
);

export const HeroSkeleton = () => (
    <div className="h-40 rounded-3xl bg-muted/15 border border-border/10 animate-pulse skeleton-hero" />
);

export const ChartSkeleton = () => (
    <div className="rounded-2xl bg-muted/15 border border-border/10 animate-pulse skeleton-chart p-5">
        <div className="h-4 w-32 rounded-md bg-muted/25 mb-4" />
        <div className="h-28 rounded-xl bg-muted/15" />
    </div>
);

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
    <div className="rounded-2xl bg-muted/15 border border-border/10 animate-pulse skeleton-table p-5">
        <div className="h-4 w-40 rounded-md bg-muted/25 mb-5" />
        <div className="space-y-3">
            {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <div className="h-3 w-20 rounded bg-muted/20" />
                    <div className="h-3 flex-1 rounded bg-muted/15" />
                    <div className="h-3 w-12 rounded bg-muted/20" />
                </div>
            ))}
        </div>
    </div>
);

export const ListSkeleton = ({ items = 3 }: { items?: number }) => (
    <div className="space-y-3">
        {Array.from({ length: items }, (_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-muted/15 border border-border/10 animate-pulse" />
        ))}
    </div>
);
