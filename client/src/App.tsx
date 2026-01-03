import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/calculator" component={Calculator} />
      <Route path="/vault" component={Vault} />
      <Route path="/timeline" component={Timeline} />
      <Route path="/lease-scanner" component={LeaseScanner} />
      <Route path="/profile" component={Profile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <MobileNav />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
