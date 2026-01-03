import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Bell, CreditCard, LogOut, ChevronRight, Settings, Languages, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  language: string;
  notifications: string;
  privacy: string;
  subscription: string;
}

export default function Profile() {
  const { logout, user: authUser } = useAuth();
  const { toast } = useToast();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await apiRequest("PUT", "/api/profile", updatedData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({ title: "Updated", description: "Settings saved successfully." });
      // Close all dialogs
      setLanguageOpen(false);
      setNotificationsOpen(false);
      setPrivacyOpen(false);
      setSubscriptionOpen(false);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const languages = [
    { label: "English", value: "English" },
    { label: "Tamil", value: "Tamil" },
    { label: "Kannada", value: "Kannada" },
    { label: "Malayalam", value: "Malayalam" },
    { label: "Telugu", value: "Telugu" },
  ];

  const privacyOptions = [
    { label: "High", description: "Minimal data sharing, maximum security" },
    { label: "Balanced", description: "Standard security with some sharing for AI features" },
    { label: "Public", description: "Full community features enabled" }
  ];

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">Profile</h1>
      </header>

      <Card className="p-6 mb-8 border-none shadow-sm bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold">{profile?.name || authUser?.username}</h2>
            <p className="text-sm opacity-80 flex items-center gap-1">
              <Mail className="w-3 h-3" /> {profile?.email || "No email set"}
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Settings</h3>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">

            {/* Language Setting */}
            <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Languages className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Language</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{profile?.language || "English"}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-3xl">
                <DialogHeader><DialogTitle className="font-heading">Select Language</DialogTitle></DialogHeader>
                <div className="grid gap-2 pt-4">
                  {languages.map((lang) => (
                    <button
                      key={lang.value}
                      onClick={() => updateProfileMutation.mutate({ language: lang.value })}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${profile?.language === lang.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                      <span className="font-medium">{lang.label}</span>
                      {profile?.language === lang.value && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Notifications Setting */}
            <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{profile?.notifications || "On"}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-3xl">
                <DialogHeader><DialogTitle className="font-heading">Push Notifications</DialogTitle></DialogHeader>
                <div className="grid gap-2 pt-4">
                  {["On", "Off"].map((state) => (
                    <button
                      key={state}
                      onClick={() => updateProfileMutation.mutate({ notifications: state })}
                      className={`flex items-center justify-between p-4 rounded-2xl transition-all ${profile?.notifications === state ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                      <span className="font-medium">{state}</span>
                      {profile?.notifications === state && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Privacy & Security */}
            <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Privacy & Security</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{profile?.privacy || "High"}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-3xl">
                <DialogHeader><DialogTitle className="font-heading">Privacy Level</DialogTitle></DialogHeader>
                <div className="grid gap-2 pt-4">
                  {privacyOptions.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => updateProfileMutation.mutate({ privacy: opt.label })}
                      className={`text-left p-4 rounded-2xl transition-all ${profile?.privacy === opt.label ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{opt.label}</span>
                        {profile?.privacy === opt.label && <Check className="w-4 h-4" />}
                      </div>
                      <p className={`text-xs ${profile?.privacy === opt.label ? "opacity-70" : "text-muted-foreground"}`}>
                        {opt.description}
                      </p>
                    </button>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Subscription */}
            <Dialog open={subscriptionOpen} onOpenChange={setSubscriptionOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">Subscription</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{profile?.subscription || "Free"}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-3xl">
                <DialogHeader><DialogTitle className="font-heading">Your Plan</DialogTitle></DialogHeader>
                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center relative overflow-hidden">
                  <Sparkles className="w-12 h-12 text-primary/10 absolute -top-2 -right-2 rotate-12" />
                  <h4 className="text-2xl font-heading font-black text-primary mb-1 uppercase tracking-tighter">
                    {profile?.subscription || "Free"} Edition
                  </h4>
                  <p className="text-xs text-muted-foreground mb-4">Unlimited lease scans & vault storage</p>
                  <Button className="w-full rounded-xl">Check for Upgrades</Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* App Settings */}
            <Dialog open={appSettingsOpen} onOpenChange={setAppSettingsOpen}>
              <DialogTrigger asChild>
                <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Settings className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">App Settings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-[340px] rounded-3xl">
                <DialogHeader>
                  <DialogTitle className="font-heading">App Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Display</h4>
                    <div className="p-4 bg-muted/30 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Dark Mode</span>
                        <span className="text-xs text-muted-foreground">System Default</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Data</h4>
                    <button className="w-full p-4 bg-muted/30 rounded-2xl text-left hover:bg-muted/50 transition-colors">
                      <span className="text-sm font-medium">Clear Cache</span>
                      <p className="text-xs text-muted-foreground mt-1">Free up storage space</p>
                    </button>
                    <button className="w-full p-4 bg-destructive/10 text-destructive rounded-2xl text-left hover:bg-destructive/20 transition-colors">
                      <span className="text-sm font-medium">Delete All Data</span>
                      <p className="text-xs opacity-70 mt-1">This action cannot be undone</p>
                    </button>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-[10px] text-center text-muted-foreground">
                      App Version 1.0.4 • Build 2024.01.03
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        <Button
          variant="destructive"
          className="w-full h-12 rounded-2xl gap-2 shadow-sm"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          TrueCost v1.0.4 • Made by ADER Digital Corporation • Backend: Python/Flask
        </p>
      </div>
    </div>
  );
}
