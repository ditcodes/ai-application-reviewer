import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Users, Loader2, Lock } from "lucide-react";
import type { Persona, PlanSetting } from "@shared/schema";

const archetypeIcons: Record<string, string> = {
  conservative_investor: "chart-bar",
  founder_friendly: "heart",
  operations_focused: "cog",
  impact_focused: "globe",
  custom: "user",
};

export default function Personas() {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: personas = [], isLoading } = useQuery<Persona[]>({
    queryKey: ["/api/personas"],
  });

  const { data: plan } = useQuery<PlanSetting>({
    queryKey: ["/api/plan-settings"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/personas", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({ title: "Persona created" });
      setDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/personas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personas"] });
      toast({ title: "Persona deleted" });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name"),
      archetype: formData.get("archetype") || "custom",
      description: formData.get("description"),
      evaluationStyle: formData.get("evaluationStyle"),
      isPaid: plan?.plan === "paid",
    });
  };

  const isFree = plan?.plan !== "paid";
  const freePersonas = personas.filter((p) => !p.isPaid);
  const paidPersonas = personas.filter((p) => p.isPaid);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold" data-testid="text-page-title">AI Reviewer Personas</h1>
          <p className="text-sm text-muted-foreground">
            Each persona simulates a panel member with a different evaluation mindset.
            {isFree && " Free plan includes 1 persona. Upgrade for panel simulation."}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-persona">
              <Plus className="h-4 w-4 mr-2" /> Add Persona
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create AI Reviewer Persona</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Persona Name</Label>
                <Input id="name" name="name" required placeholder="e.g. The Pragmatist" data-testid="input-persona-name" />
              </div>
              <div className="space-y-2">
                <Label>Archetype</Label>
                <select name="archetype" defaultValue="custom" className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
                  <option value="conservative_investor">Conservative Investor</option>
                  <option value="founder_friendly">Founder Friendly</option>
                  <option value="operations_focused">Operations Focused</option>
                  <option value="impact_focused">Impact Focused</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  required
                  placeholder="Describe the persona's background and perspective..."
                  data-testid="input-persona-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evaluationStyle">Evaluation Style</Label>
                <Textarea
                  id="evaluationStyle"
                  name="evaluationStyle"
                  required
                  placeholder="How does this persona approach evaluations?"
                  data-testid="input-persona-style"
                />
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="w-full" data-testid="button-submit-persona">
                {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Create Persona
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : personas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="font-medium text-foreground mb-1">No personas configured</h3>
            <p className="text-sm text-muted-foreground">Create AI reviewer personas to simulate panel reviews.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Free Personas */}
          {freePersonas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Included in Free Plan</h2>
              {freePersonas.map((persona) => (
                <PersonaCard key={persona.id} persona={persona} onDelete={() => deleteMutation.mutate(persona.id)} />
              ))}
            </div>
          )}

          {/* Paid Personas */}
          {paidPersonas.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-muted-foreground">Panel Reviewers</h2>
                {isFree && <Badge variant="secondary" className="text-[11px]"><Lock className="h-3 w-3 mr-1" /> Pro</Badge>}
              </div>
              {paidPersonas.map((persona) => (
                <PersonaCard
                  key={persona.id}
                  persona={persona}
                  locked={isFree}
                  onDelete={() => deleteMutation.mutate(persona.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PersonaCard({ persona, locked, onDelete }: { persona: Persona; locked?: boolean; onDelete: () => void }) {
  return (
    <Card className={locked ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-sm">{persona.name}</p>
              <Badge variant="secondary" className="text-[11px]">
                {persona.archetype.replace(/_/g, " ")}
              </Badge>
              {locked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">{persona.description}</p>
            <p className="text-xs text-muted-foreground">
              Style: {persona.evaluationStyle}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete} data-testid={`button-delete-persona-${persona.id}`}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
