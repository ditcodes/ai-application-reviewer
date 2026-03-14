import { Switch, Route, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import Applications from "@/pages/applications";
import ApplicationDetail from "@/pages/application-detail";
import EvaluationRules from "@/pages/evaluation-rules";
import Personas from "@/pages/personas";
import Reviews from "@/pages/reviews";
import Shortlists from "@/pages/shortlists";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/applications" component={Applications} />
          <Route path="/applications/:id" component={ApplicationDetail} />
          <Route path="/rules" component={EvaluationRules} />
          <Route path="/personas" component={Personas} />
          <Route path="/reviews" component={Reviews} />
          <Route path="/shortlists" component={Shortlists} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="reviewai-theme">
      <QueryClientProvider client={queryClient}>
        <Router hook={useHashLocation}>
          <AppLayout />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
