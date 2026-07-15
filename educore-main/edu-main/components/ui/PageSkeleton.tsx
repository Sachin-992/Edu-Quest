const PageSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10 animate-pulse">
        {/* Header skeleton */}
        <div className="sticky top-0 z-30 border-b border-border/20 bg-card/50 backdrop-blur-sm">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between px-5 md:px-8 h-16">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted/40" />
                    <div className="space-y-1.5">
                        <div className="h-4 w-32 rounded-md bg-muted/40" />
                        <div className="h-3 w-20 rounded-md bg-muted/30" />
                    </div>
                </div>
                <div className="h-9 w-9 rounded-xl bg-muted/30" />
            </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-3xl mx-auto px-4 py-5 space-y-5">
            {/* Hero card */}
            <div className="h-40 rounded-3xl bg-muted/20 border border-border/10" />

            {/* Stat cards row */}
            <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-2xl bg-muted/15" />
                <div className="h-20 rounded-2xl bg-muted/15" />
            </div>

            {/* Nav grid */}
            <div className="grid grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-muted/15" />
                ))}
            </div>

            {/* Content cards */}
            <div className="space-y-3">
                <div className="h-24 rounded-2xl bg-muted/15" />
                <div className="h-24 rounded-2xl bg-muted/15" />
            </div>
        </div>
    </div>
);

export default PageSkeleton;
