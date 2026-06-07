import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="border-white/[0.06] bg-white/[0.02]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl bg-white/[0.06]" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16 bg-white/[0.06]" />
                <Skeleton className="h-7 w-24 bg-white/[0.06]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}