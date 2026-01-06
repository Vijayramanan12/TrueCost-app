import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileNav } from "@/components/layout/MobileNav";
import Home from "@/pages/Home";
import Calculator from "@/pages/Calculator";
import Vault from "@/pages/Vault";
import Timeline from "@/pages/Timeline";
import LeaseScanner from "@/pages/LeaseScanner";
import Profile from "@/pages/Profile";
import LoanCalculator from "@/pages/LoanCalculator";
import Terms from "@/pages/Terms";
import NotFound from "@/pages/not-found";

import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Login from "@/pages/Login";

function Router() {
  const { token, isLoading } = useAuth();

  if (isLoading) return null;

  if (!token) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/terms" component={Terms} />
        <Route>
          {() => { window.location.href = "/login"; return null; }}
        </Route>
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/vault" component={Vault} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/lease-scanner" component={LeaseScanner} />
      <Route path="/loan-calculator" component={LoanCalculator} />
      <Route path="/profile" component={Profile} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

import { LanguageProvider } from "./lib/language-context";
import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  language: string;
}

function AppContent() {
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
    enabled: !!localStorage.getItem("auth_token"),
  });

  return (
    <LanguageProvider initialLanguage={profile?.language || "English"}>
      <TooltipProvider>
        <WouterRouter>
          <div className="min-h-screen bg-background pb-16">
            <Router />
            <MobileNav />
          </div>
          <Toaster />
        </WouterRouter>
      </TooltipProvider>
    </LanguageProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
