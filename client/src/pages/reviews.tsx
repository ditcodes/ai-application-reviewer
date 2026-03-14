import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, User, Calendar, Star } from "lucide-react";
import { Link } from "wouter";
import type { ReviewWithApplication } from "@shared/schema";

export default function Reviews() {
  const { data: reviews, isLoading } = useQuery<ReviewWithApplication[]>({
    queryKey: ["/api/reviews"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-muted-foreground">AI-generated application reviews</p>
        </div>
        <Badge variant="outline">{reviews?.length ?? 0} total</Badge>
      </div>

      {reviews?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
            <p className="text-muted-foreground text-center">
              Reviews will appear here after applications are evaluated.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews?.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">
                      <Link href={`/applications/${review.applicationId}`} className="hover:underline">
                        {review.application?.applicantName ?? `Application #${review.applicationId}`}
                      </Link>
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {review.reviewerPersona}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">{review.overallScore}/10</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{review.summary}</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <Link href={`/applications/${review.applicationId}`}>View Application</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
