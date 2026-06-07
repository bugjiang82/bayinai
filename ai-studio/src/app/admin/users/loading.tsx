import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsersLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 flex-1 max-w-md bg-white/[0.06] rounded-[10px]" />
        <Skeleton className="h-9 w-32 bg-white/[0.06] rounded-[10px]" />
      </div>
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardContent className="p-0">
          <div className="grid grid-cols-[1fr_1fr_80px_80px_100px_140px] gap-2 px-4 py-3 border-b border-white/[0.06]">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-3 w-10 bg-white/[0.06]" />
            ))}
          </div>
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-5 flex-1 bg-white/[0.06] rounded" />
                <Skeleton className="h-5 flex-1 bg-white/[0.06] rounded" />
                <Skeleton className="h-5 w-16 bg-white/[0.06] rounded" />
                <Skeleton className="h-5 w-16 bg-white/[0.06] rounded" />
                <Skeleton className="h-5 w-20 bg-white/[0.06] rounded" />
                <Skeleton className="h-5 w-28 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}