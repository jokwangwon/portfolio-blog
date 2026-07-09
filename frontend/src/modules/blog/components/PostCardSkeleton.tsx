import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PostCardSkeleton() {
  return (
    <Card className="glass-card">
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-12 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-4">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-12" />
      </CardFooter>
    </Card>
  );
}
