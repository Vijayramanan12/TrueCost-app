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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter>
            <div className="min-h-screen bg-background pb-16">
              <Router />
              <MobileNav />
            </div>
            <Toaster />
          </WouterRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
