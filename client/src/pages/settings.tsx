import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Crown, Shield, Globe } from "lucide-react";
import type { PlanSetting, ContextSetting } from "@shared/schema";

export default function Settings() {
  const { toast } = useToast();

  const { data: plan, isLoading: planLoading } = useQuery<PlanSetting>({
    queryKey: ["/api/plan-settings"],
  });

  const { data: contextSettings = [], isLoading: ctxLoading } = useQuery<ContextSetting[]>({
    queryKey: ["/api/context-settings"],
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (data: Partial<PlanSetting>) => {
      const res = await apiRequest("PATCH", "/api/plan-settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-settings"] });
      toast({ title: "Settings updated" });
    },
  });

  const updateContextMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await apiRequest("PATCH", `/api/context-settings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/context-settings"] });
    },
  });

  if (planLoading || ctxLoading) {
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold" data-testid="text-page-title">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure your plan, review mode, and contextual evaluation settings.
        </p>
      </div>

      {/* Plan Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4 text-muted-foreground" />
            Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-xs text-muted-foreground">
                {plan?.plan === "paid"
                  ? "Pro: Multiple personas, shortlisting, classification, email automation"
                  : "Free: 1 persona, rule-based evaluation, justification reports"}
              </p>
            </div>
            <Button
              variant={plan?.plan === "paid" ? "secondary" : "default"}
              size="sm"
              onClick={() =>
                updatePlanMutation.mutate({
                  plan: plan?.plan === "paid" ? "free" : "paid",
                })
              }
              data-testid="button-toggle-plan"
            >
              {plan?.plan === "paid" ? "Downgrade to Free" : "Upgrade to Pro"}
            </Button>
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pro Features</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                "Multiple AI reviewer personas",
                "Automated shortlisting",
                "Multi-level classification",
                "Attachment analysis",
                "Automated email communication",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm">
                  <div className={`w-1.5 h-1.5 rounded-full ${plan?.plan === "paid" ? "bg-primary" : "bg-muted-foreground/30"}`} />
                  <span className={plan?.plan !== "paid" ? "text-muted-foreground" : ""}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Review Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Human-in-the-Loop</p>
              <p className="text-xs text-muted-foreground">
                AI produces recommendations, you approve or override the final decision.
              </p>
            </div>
            <Switch
              checked={plan?.reviewMode === "human_in_loop"}
              onCheckedChange={(checked) =>
                updatePlanMutation.mutate({
                  reviewMode: checked ? "human_in_loop" : "autonomous",
                })
              }
              data-testid="switch-review-mode"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Autonomous Mode</p>
              <p className="text-xs text-muted-foreground">
                AI makes final decisions and can trigger follow-up actions automatically.
              </p>
            </div>
            <Switch
              checked={plan?.reviewMode === "autonomous"}
              onCheckedChange={(checked) =>
                updatePlanMutation.mutate({
                  reviewMode: checked ? "autonomous" : "human_in_loop",
                })
              }
              data-testid="switch-autonomous-mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Context-Aware Evaluation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            Context-Aware Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-xs text-muted-foreground mb-4">
            Enable contextual signals to help balance cohorts. These are secondary signals
            and do not override application quality.
          </p>
          {contextSettings.map((setting) => (
            <div key={setting.id} className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <p className="text-sm">{setting.name}</p>
                <p className="text-xs text-muted-foreground">Weight: {setting.weight}</p>
              </div>
              <Switch
                checked={setting.enabled}
                onCheckedChange={(checked) =>
                  updateContextMutation.mutate({ id: setting.id, enabled: checked })
                }
                data-testid={`switch-context-${setting.id}`}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
