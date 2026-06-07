import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContentLoading() {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-9 w-32 bg-white/[0.06] rounded-[10px]" />
        <Skeleton className="h-9 w-28 bg-white/[0.06] rounded-[10px]" />
      </div>
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardContent className="p-0">
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-white/[0.06] shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 bg-white/[0.06]" />
                  <Skeleton className="h-3 w-1/2 bg-white/[0.06]" />
                </div>
                <Skeleton className="h-5 w-16 bg-white/[0.06] rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}