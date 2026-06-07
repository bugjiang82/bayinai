import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function OverviewLoading() {
  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-28 bg-white/[0.06]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
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
          </CardContent>
        </Card>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="pb-2">
            <Skeleton className="h-5 w-28 bg-white/[0.06]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
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
    </div>
  );
}