import {
  LayoutDashboard,
  FileText,
  Scale,
  Users,
  ClipboardCheck,
  ListOrdered,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { PlanSetting } from "@shared/schema";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Applications", url: "/applications", icon: FileText },
  { title: "Evaluation Rules", url: "/rules", icon: Scale },
  { title: "Personas", url: "/personas", icon: Users },
  { title: "Reviews", url: "/reviews", icon: ClipboardCheck },
  { title: "Shortlists", url: "/shortlists", icon: ListOrdered },
];

const secondaryNav = [
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: plan } = useQuery<PlanSetting>({ queryKey: ["/api/plan-settings"] });

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-label="ReviewAI">
            <rect width="32" height="32" rx="8" fill="hsl(var(--primary))" />
            <path d="M8 10h16v2H8zM8 15h12v2H8zM8 20h8v2H8z" fill="hsl(var(--primary-foreground))" />
            <circle cx="24" cy="21" r="4" fill="hsl(var(--primary-foreground))" fillOpacity="0.9" />
            <path d="M22.5 21l1 1 2-2" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-tight" data-testid="text-app-name">ReviewAI</span>
            <span className="text-[11px] text-muted-foreground leading-tight">Application Reviewer</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.url === "/"
                        ? location === "/"
                        : location.startsWith(item.url)
                    }
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase()}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 pb-4">
        <div className="flex items-center gap-2">
          <Badge variant={plan?.plan === "paid" ? "default" : "secondary"} className="text-[11px]">
            {plan?.plan === "paid" ? "Pro" : "Free"}
          </Badge>
          <span className="text-[11px] text-muted-foreground">
            {plan?.reviewMode === "autonomous" ? "Autonomous" : "Human-in-Loop"}
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
