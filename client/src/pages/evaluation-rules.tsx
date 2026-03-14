import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Scale, Plus, Trash2, GripVertical } from "lucide-react";
import type { EvaluationRule } from "@shared/schema";

export default function EvaluationRules() {
  const { toast } = useToast();
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleDescription, setNewRuleDescription] = useState("");
  const [newRuleWeight, setNewRuleWeight] = useState(5);

  const { data: rules, isLoading } = useQuery<EvaluationRule[]>({
    queryKey: ["/api/evaluation-rules"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/evaluation-rules", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-rules"] });
      setNewRuleName("");
      setNewRuleDescription("");
      setNewRuleWeight(5);
      toast({ title: "Rule created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/evaluation-rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-rules"] });
      toast({ title: "Rule deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await apiRequest("PATCH", `/api/evaluation-rules/${id}`, { enabled });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evaluation-rules"] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4 max-w-3xl mx-auto">
        <Skeleton className="h-6 w-40" />
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold" data-testid="text-page-title">Evaluation Rules</h1>
        <p className="text-sm text-muted-foreground">
          Define the criteria used to evaluate applications. Each rule has a weight (1-10) that
          influences scoring.
        </p>
      </div>

      {/* Add Rule Form */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <h3 className="text-sm font-medium">Add New Rule</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="rule-name" className="text-xs">Rule Name</Label>
              <Input
                id="rule-name"
                placeholder="e.g., Technical Skills"
                value={newRuleName}
                onChange={(e) => setNewRuleName(e.target.value)}
                data-testid="input-rule-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rule-weight" className="text-xs">Weight (1-10)</Label>
              <Input
                id="rule-weight"
                type="number"
                min={1}
                max={10}
                value={newRuleWeight}
                onChange={(e) => setNewRuleWeight(Number(e.target.value))}
                data-testid="input-rule-weight"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rule-desc" className="text-xs">Description</Label>
            <Input
              id="rule-desc"
              placeholder="Describe what this rule evaluates..."
              value={newRuleDescription}
              onChange={(e) => setNewRuleDescription(e.target.value)}
              data-testid="input-rule-description"
            />
          </div>
          <Button
            size="sm"
            onClick={() =>
              createMutation.mutate({
                name: newRuleName,
                description: newRuleDescription,
                weight: newRuleWeight,
                enabled: true,
              })
            }
            disabled={!newRuleName || createMutation.isPending}
            data-testid="button-add-rule"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Rule
          </Button>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-2">
        {rules?.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <Scale className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No evaluation rules yet. Add your first rule above.</p>
            </CardContent>
          </Card>
        ) : (
          rules?.map((rule) => (
            <Card key={rule.id} className={!rule.enabled ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <GripVertical className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" data-testid={`text-rule-name-${rule.id}`}>{rule.name}</span>
                        <Badge variant="outline" className="text-[11px]">
                          Weight {rule.weight}
                        </Badge>
                        {!rule.enabled && (
                          <Badge variant="secondary" className="text-[11px]">Disabled</Badge>
                        )}
                      </div>
                      {rule.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7 px-2"
                      onClick={() => toggleMutation.mutate({ id: rule.id, enabled: !rule.enabled })}
                      data-testid={`button-toggle-rule-${rule.id}`}
                    >
                      {rule.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      data-testid={`button-delete-rule-${rule.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
