import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useParams, Link } from "wouter";
import { useState } from "react";
import { Application, Review, EvaluationRule } from "@shared/schema";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Star, User, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" as const, color: "text-yellow-500" },
  reviewing: { label: "Reviewing", icon: AlertCircle, variant: "default" as const, color: "text-blue-500" },
  shortlisted: { label: "Shortlisted", icon: CheckCircle, variant: "default" as const, color: "text-green-500" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" as const, color: "text-red-500" },
  accepted: { label: "Accepted", icon: CheckCircle, variant: "default" as const, color: "text-emerald-500" },
};

export default function ApplicationDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [reviewContent, setReviewContent] = useState("");
  const [reviewScore, setReviewScore] = useState("");

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["/api/applications", id],
    queryFn: () => apiRequest(`/api/applications/${id}`),
  });

  const { data: reviews } = useQuery<Review[]>({
    queryKey: ["/api/applications", id, "reviews"],
    queryFn: () => apiRequest(`/api/applications/${id}/reviews`),
  });

  const { data: rules } = useQuery<EvaluationRule[]>({
    queryKey: ["/api/evaluation-rules"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest(`/api/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", id] });
      toast({ title: "Status updated successfully" });
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: (data: { content: string; score?: number }) =>
      apiRequest(`/api/applications/${id}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications", id, "reviews"] });
      setReviewContent("");
      setReviewScore("");
      toast({ title: "Review added successfully" });
    },
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Loading application...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!application) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-muted-foreground">Application not found</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;

  const handleAddReview = () => {
    if (!reviewContent.trim()) return;
    addReviewMutation.mutate({
      content: reviewContent,
      score: reviewScore ? parseInt(reviewScore) : undefined,
    });
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4 flex-1">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/applications">Applications</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{application.applicantName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Link href="/applications">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">{application.applicantName}</h1>
                <p className="text-muted-foreground">{application.applicantEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={status.variant} className="text-sm px-3 py-1">
                <StatusIcon className={`h-4 w-4 mr-1 ${status.color}`} />
                {status.label}
              </Badge>
              <Select
                value={application.status}
                onValueChange={(value) => updateStatusMutation.mutate(value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Application Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Applicant Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Name</Label>
                    <p className="font-medium">{application.applicantName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Email</Label>
                    <p className="font-medium">{application.applicantEmail}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Position</Label>
                    <p className="font-medium">{application.position}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Applied</Label>
                    <p className="font-medium">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {application.experience && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Experience</Label>
                      <p className="font-medium">{application.experience}</p>
                    </div>
                  )}
                  {application.skills && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Skills</Label>
                      <p className="font-medium">{application.skills}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Cover Letter */}
              {application.coverLetter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Cover Letter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Add Review */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Add Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Review Notes</Label>
                    <Textarea
                      placeholder="Add your review notes..."
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label>Score (1-10)</Label>
                    <Select value={reviewScore} onValueChange={setReviewScore}>
                      <SelectTrigger className="w-32 mt-1">
                        <SelectValue placeholder="Score" />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddReview}
                    disabled={!reviewContent.trim() || addReviewMutation.isPending}
                  >
                    Add Review
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Evaluation Rules */}
              {rules && rules.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Evaluation Criteria</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between text-sm">
                        <span>{rule.name}</span>
                        <Badge variant="outline">{rule.weight}%</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Reviews */}
              {reviews && reviews.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Reviews ({reviews.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b last:border-0 pb-3 last:pb-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                          {review.score && (
                            <Badge variant="outline" className="text-xs">
                              {review.score}/10
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{review.content}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
