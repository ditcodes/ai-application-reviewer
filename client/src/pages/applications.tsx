import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Application } from "@shared/schema";
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
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Eye, CheckCircle, XCircle, Clock, AlertCircle, Filter } from "lucide-react";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, variant: "secondary" as const, color: "text-yellow-500" },
  reviewing: { label: "Reviewing", icon: AlertCircle, variant: "default" as const, color: "text-blue-500" },
  shortlisted: { label: "Shortlisted", icon: CheckCircle, variant: "default" as const, color: "text-green-500" },
  rejected: { label: "Rejected", icon: XCircle, variant: "destructive" as const, color: "text-red-500" },
  accepted: { label: "Accepted", icon: CheckCircle, variant: "default" as const, color: "text-emerald-500" },
};

export default function Applications() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newApplication, setNewApplication] = useState({
    applicantName: "",
    applicantEmail: "",
    position: "",
    coverLetter: "",
    experience: "",
    skills: "",
  });

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications"],
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof newApplication) =>
      apiRequest("/api/applications", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setIsAddDialogOpen(false);
      setNewApplication({
        applicantName: "",
        applicantEmail: "",
        position: "",
        coverLetter: "",
        experience: "",
        skills: "",
      });
      toast({ title: "Application added successfully" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest(`/api/applications/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({ title: "Status updated" });
    },
  });

  const filteredApplications = applications?.filter((app) => {
    const matchesSearch =
      search === "" ||
      app.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      app.applicantEmail.toLowerCase().includes(search.toLowerCase()) ||
      app.position.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateApplication = () => {
    if (!newApplication.applicantName || !newApplication.applicantEmail || !newApplication.position) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate(newApplication);
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
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Applications</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="px-4">
            <ThemeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Applications</h1>
              <p className="text-muted-foreground">
                {filteredApplications?.length ?? 0} application{(filteredApplications?.length ?? 0) !== 1 ? "s" : ""}
              </p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Application
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>New Application</DialogTitle>
                  <DialogDescription>
                    Add a new job application to review.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name *</Label>
                      <Input
                        value={newApplication.applicantName}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, applicantName: e.target.value }))}
                        placeholder="John Doe"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        value={newApplication.applicantEmail}
                        onChange={(e) => setNewApplication(prev => ({ ...prev, applicantEmail: e.target.value }))}
                        placeholder="john@example.com"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Position *</Label>
                    <Input
                      value={newApplication.position}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, position: e.target.value }))}
                      placeholder="Software Engineer"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Experience</Label>
                    <Input
                      value={newApplication.experience}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="5 years"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Skills</Label>
                    <Input
                      value={newApplication.skills}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, skills: e.target.value }))}
                      placeholder="React, TypeScript, Node.js"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Cover Letter</Label>
                    <Textarea
                      value={newApplication.coverLetter}
                      onChange={(e) => setNewApplication(prev => ({ ...prev, coverLetter: e.target.value }))}
                      placeholder="Applicant's cover letter..."
                      className="mt-1"
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateApplication} disabled={createMutation.isPending}>
                    Add Application
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reviewing">Reviewing</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Loading applications...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No applications found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications?.map((app) => {
                    const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={app.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{app.applicantName}</p>
                            <p className="text-sm text-muted-foreground">{app.applicantEmail}</p>
                          </div>
                        </TableCell>
                        <TableCell>{app.position}</TableCell>
                        <TableCell>
                          <Select
                            value={app.status}
                            onValueChange={(value) => updateStatusMutation.mutate({ id: app.id, status: value })}
                          >
                            <SelectTrigger className="w-36 h-8">
                              <Badge variant={status.variant} className="text-xs">
                                <StatusIcon className={`h-3 w-3 mr-1 ${status.color}`} />
                                {status.label}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="reviewing">Reviewing</SelectItem>
                              <SelectItem value="shortlisted">Shortlisted</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                              <SelectItem value="accepted">Accepted</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/applications/${app.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
