import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle, Clock, TrendingUp, Users, Zap } from "lucide-react";

interface DashboardStats {
  totalApplications: number;
  reviewed: number;
  pending: number;
  decided: number;
  totalReviews: number;
  estimatedManualTime: number;
  estimatedAiTime: number;
  timeSaved: number;
  productivity: number;
  classifications: {
    trailblazer: number;
    rising_star: number;
    needs_development: number;
    not_selected: number;
  };
  decisions: {
    accepted: number;
    rejected: number;
    waitlisted: number;
  };
  avgScore: number;
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="space-y-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = [
    {
      title: "Total Applications",
      value: stats?.totalApplications || 0,
      icon: FileText,
      description: `${stats?.pending || 0} pending review`,
    },
    {
      title: "Reviewed",
      value: stats?.reviewed || 0,
      icon: CheckCircle,
      description: `${stats?.decided || 0} decisions made`,
    },
    {
      title: "Time Saved",
      value: `${stats?.timeSaved || 0}m`,
      icon: Clock,
      description: `vs ${stats?.estimatedManualTime || 0}m manual`,
    },
    {
      title: "Productivity Gain",
      value: `${stats?.productivity || 0}%`,
      icon: TrendingUp,
      description: "estimated improvement",
    },
  ];

  const classificationData = [
    { label: "Trailblazer", value: stats?.classifications.trailblazer || 0, color: "bg-emerald-500" },
    { label: "Rising Star", value: stats?.classifications.rising_star || 0, color: "bg-blue-500" },
    { label: "Needs Development", value: stats?.classifications.needs_development || 0, color: "bg-amber-500" },
    { label: "Not Selected", value: stats?.classifications.not_selected || 0, color: "bg-red-400" },
  ];

  const totalClassified = classificationData.reduce((s, c) => s + c.value, 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Operational overview of your application review pipeline.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-1">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-2xl font-bold tabular-nums" data-testid={`kpi-${kpi.title.toLowerCase().replace(/\s+/g, "-")}`}>
                    {kpi.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{kpi.description}</p>
                </div>
                <div className="p-2 rounded-md bg-primary/10">
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Classification Breakdown */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              Classification Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {totalClassified === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No applications classified yet. Run an evaluation to see results.
              </p>
            ) : (
              classificationData.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex justify-between items-center text-sm">
                    <span>{c.label}</span>
                    <span className="font-medium tabular-nums">{c.value}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.color} transition-all duration-500`}
                      style={{ width: `${totalClassified > 0 ? (c.value / totalClassified) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Operational Impact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Operational Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Manual Review Estimate</p>
                <p className="text-lg font-semibold tabular-nums">{stats?.estimatedManualTime || 0} min</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">AI Review Time</p>
                <p className="text-lg font-semibold tabular-nums">{stats?.estimatedAiTime || 0} min</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Time Saved</p>
                <p className="text-lg font-semibold tabular-nums text-primary">{stats?.timeSaved || 0} min</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Score</p>
                <p className="text-lg font-semibold tabular-nums">{stats?.avgScore || 0}/10</p>
              </div>
            </div>
            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Reviews Generated</span>
                <span className="font-medium tabular-nums">{stats?.totalReviews || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Decisions Made</span>
                <span className="font-medium tabular-nums">
                  {(stats?.decisions.accepted || 0) + (stats?.decisions.rejected || 0) + (stats?.decisions.waitlisted || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
