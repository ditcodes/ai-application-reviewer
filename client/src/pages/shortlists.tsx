import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ListOrdered, Eye, CheckCircle, XCircle, Clock, Lock } from "lucide-react";
import type { Application, PlanSetting } from "@shared/schema";

const classificationLabels: Record<string, string> = {
  trailblazer: "Trailblazer",
  rising_star: "Rising Star",
  needs_development: "Needs Development",
  not_selected: "Not Selected",
};

const classificationColors: Record<string, string> = {
  trailblazer: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  rising_star: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  needs_development: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  not_selected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function Shortlists() {
  const { toast } = useToast();

  const { data: applications = [], isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const { data: plan } = useQuery<PlanSetting>({
    queryKey: ["/api/plan-settings"],
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: string }) => {
      const res = await apiRequest("POST", `/api/applications/${id}/decide`, { decision });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Decision recorded" });
    },
  });

  const isFree = plan?.plan !== "paid";
  const reviewed = applications
    .filter((a) => a.overallScore !== null)
    .sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

  const ranked = reviewed.map((app, i) => ({ ...app, rank: i + 1 }));

  const trailblazers = ranked.filter((a) => a.classification === "trailblazer");
  const risingStars = ranked.filter((a) => a.classification === "rising_star");
  const needsDev = ranked.filter((a) => a.classification === "needs_development");
  const notSelected = ranked.filter((a) => a.classification === "not_selected");

  const isHumanInLoop = plan?.reviewMode === "human_in_loop";

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold" data-testid="text-page-title">Shortlists</h1>
          {isFree && (
            <Badge variant="secondary" className="text-[11px]">
              <Lock className="h-3 w-3 mr-1" /> Pro feature
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isFree
            ? "Ranked shortlists and multi-level classification are available on the Pro plan. Rankings shown below are a preview."
            : `${reviewed.length} applications ranked by overall score. Use classification tabs to review by tier.`}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : reviewed.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ListOrdered className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">No ranked applications</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Evaluate applications first to generate rankings and shortlists.
            </p>
            <Link href="/applications">
              <Button variant="secondary" className="mt-4">Go to Applications</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({ranked.length})</TabsTrigger>
            <TabsTrigger value="trailblazer">Trailblazers ({trailblazers.length})</TabsTrigger>
            <TabsTrigger value="rising_star">Rising Stars ({risingStars.length})</TabsTrigger>
            <TabsTrigger value="needs_development">Needs Dev ({needsDev.length})</TabsTrigger>
            <TabsTrigger value="not_selected">Not Selected ({notSelected.length})</TabsTrigger>
          </TabsList>

          {[
            { value: "all", items: ranked },
            { value: "trailblazer", items: trailblazers },
            { value: "rising_star", items: risingStars },
            { value: "needs_development", items: needsDev },
            { value: "not_selected", items: notSelected },
          ].map(({ value, items }) => (
            <TabsContent key={value} value={value} className="space-y-2 mt-4">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No applications in this category.</p>
              ) : (
                items.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold tabular-nums">{app.rank}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{app.name}</p>
                              {app.classification && (
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${classificationColors[app.classification] || ""}`}>
                                  {classificationLabels[app.classification]}
                                </span>
                              )}
                              {app.decision && (
                                <Badge variant={app.decision === "accepted" ? "default" : app.decision === "waitlisted" ? "secondary" : "destructive"} className="text-[11px]">
                                  {app.decision}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{app.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <p className="text-lg font-bold tabular-nums">{app.overallScore}</p>
                            <p className="text-[11px] text-muted-foreground">/10</p>
                          </div>
                          {!app.decision && isHumanInLoop && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => decideMutation.mutate({ id: app.id, decision: "accepted" })}
                                title="Accept"
                              >
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => decideMutation.mutate({ id: app.id, decision: "waitlisted" })}
                                title="Waitlist"
                              >
                                <Clock className="h-4 w-4 text-amber-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => decideMutation.mutate({ id: app.id, decision: "rejected" })}
                                title="Reject"
                              >
                                <XCircle className="h-4 w-4 text-red-400" />
                              </Button>
                            </div>
                          )}
                          <Link href={`/applications/${app.id}`}>
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
