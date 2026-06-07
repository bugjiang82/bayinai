import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader>
          <Skeleton className="h-5 w-20 bg-white/[0.06]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg bg-white/[0.06]" />
                <Skeleton className="h-4 w-24 bg-white/[0.06]" />
              </div>
              <Skeleton className="h-4 w-16 bg-white/[0.06]" />
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-white/[0.06] bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-28 bg-white/[0.06]" />
          <Skeleton className="h-9 w-24 rounded-lg bg-white/[0.06]" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-white/[0.06]" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}