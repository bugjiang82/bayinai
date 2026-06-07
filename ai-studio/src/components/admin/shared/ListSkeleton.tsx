import { Skeleton } from "@/components/ui/skeleton";

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full bg-white/[0.06]" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-28 bg-white/[0.06]" />
              <Skeleton className="h-3 w-40 bg-white/[0.06]" />
            </div>
          </div>
          <Skeleton className="h-4 w-16 bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}