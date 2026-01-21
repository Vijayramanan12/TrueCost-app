import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import {
  User, Mail, Shield, Bell, CreditCard, LogOut, ChevronRight,
  Settings, Languages, Check, Loader2, Sparkles, Smartphone,
  Database, Moon, Sun, AlertTriangle, RefreshCcw, HardDrive, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation, Language } from "@/lib/language-context";

interface UserProfile {
  id: string;
  account_id: string;
  name: string;
  email: string;
  language: string;
  notifications: string;
  privacy: string;
  subscription: string;
}

export default function Profile() {
  const [, setLocation] = useLocation();
  const { logout, user: authUser } = useAuth();
  const { toast } = useToast();
  const { t, setLanguage } = useTranslation();

  // Dialog States
  const [languageOpen, setLanguageOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);

  // Local Preferences (Simulated persistence)
  const [highSecurityAlerts, setHighSecurityAlerts] = useState(true);
  const [appUpdates, setAppUpdates] = useState(true);
  const [localProcessing, setLocalProcessing] = useState(true);
  const { theme, setTheme } = useTheme();
  const [emailStatus, setEmailStatus] = useState<"verified" | "sending" | "sent" | "unverified">("unverified");

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const sendOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/send-otp", { email: profile?.email });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to send code");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      setEmailStatus("sent");
      setOtpOpen(true);
      toast({ title: "Code Sent", description: data.message });
    },
    onError: (error: Error) => {
      setEmailStatus("unverified");
      toast({ title: "Send Failed", description: error.message, variant: "destructive" });
    }
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/verify-otp", { email: profile?.email, otp: otpCode });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Invalid code");
      }
      return res.json();
    },
    onSuccess: () => {
      setOtpOpen(false);
      setEmailStatus("verified");
      toast({ title: "Verified!", description: "Double Opt-In successful." });
    },
    onError: (error: Error) => {
      toast({ title: "Verification Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleVerifyEmail = () => {
    setEmailStatus("sending");
    sendOtpMutation.mutate();
  };

  const handleConfirmVerify = () => {
    setOtpOpen(true);
  };

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const res = await apiRequest("PUT", "/api/profile", updatedData);
      return res.json();
    },
    onSuccess: (data: UserProfile) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      if (data.language) setLanguage(data.language as Language);
      toast({ title: t("updated"), description: t("settingsSaved") });
      // Close relevant dialogs
      setLanguageOpen(false);
    },
  });



  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/delete-account");
      if (!res.ok) throw new Error("Failed to delete account");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Account Deleted", description: "Your account has been permanently removed." });
      logout();
    },
    onError: (error: Error) => {
      toast({ title: "Deletion Failed", description: error.message, variant: "destructive" });
    }
  });

  const handleResetSettings = () => {
    // Reset local states
    setHighSecurityAlerts(true);
    setAppUpdates(true);
    setLocalProcessing(true);
    setTheme("system");
    toast({ title: "Reset Complete", description: t("resetWarning") });
  };

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

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background text-foreground">
      <header className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-foreground mb-1">{t("profile")}</h1>
      </header>

      {/* User Card */}
      <Card className="p-6 mb-8 border-none shadow-xl bg-primary dark:bg-slate-900 text-primary-foreground dark:text-slate-100 relative overflow-hidden rounded-3xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center shadow-inner ring-1 ring-white/30">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold">{profile?.name || authUser?.username}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-mono tracking-tight opacity-90">
                  {profile?.account_id || "TC-GUEST"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              <Database className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">{t("localOnly")}</span>
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]"></span>
            </div>
          </div>
        </div>
      </Card>



      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">{t("settings")}</h3>

        <div className="bg-card border rounded-3xl overflow-hidden shadow-sm divide-y">

          <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Verify Your Email</DialogTitle>
                <DialogDescription>
                  We sent a 6-digit code to {profile?.email}. Please enter it below to confirm your ownership.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e: any) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="text-center text-lg tracking-widest uppercase"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOtpOpen(false)}>Cancel</Button>
                <Button onClick={() => verifyOtpMutation.mutate()} disabled={otpCode.length < 6 || verifyOtpMutation.isPending}>
                  {verifyOtpMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Verify Code
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Language */}
          <Dialog open={languageOpen} onOpenChange={setLanguageOpen}>
            <DialogTrigger asChild>
              <div onClick={() => setLanguageOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Languages className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{t("language")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{profile?.language || "English"}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[340px] rounded-3xl">
              <DialogHeader><DialogTitle>{t("selectLanguage")}</DialogTitle></DialogHeader>
              <div className="grid gap-2 pt-2">
                {languages.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => updateProfileMutation.mutate({ language: lang.value })}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${profile?.language === lang.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                  >
                    <span className="text-sm font-medium">{lang.label}</span>
                    {profile?.language === lang.value && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* Notifications (Refined) */}
          <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <DialogTrigger asChild>
              <div onClick={() => setNotificationsOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Bell className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{t("notifications")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[340px] rounded-3xl">
              <DialogHeader><DialogTitle>{t("notifications")}</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="flex flex-col gap-1">
                    <span>{t("pushNotifications")}</span>
                    <span className="font-normal text-xs text-muted-foreground">Receive alerts on your device</span>
                  </Label>
                  <Switch
                    checked={profile?.notifications === "On"}
                    onCheckedChange={(c) => updateProfileMutation.mutate({ notifications: c ? "On" : "Off" })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex flex-col gap-1">
                    <span>{t("highSecurityDeposit")}</span>
                    <span className="font-normal text-xs text-muted-foreground">Alert if deposit &gt; 3 months</span>
                  </Label>
                  <Switch checked={highSecurityAlerts} onCheckedChange={setHighSecurityAlerts} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="flex flex-col gap-1">
                    <span>{t("appUpdates")}</span>
                    <span className="font-normal text-xs text-muted-foreground">New features and improvements</span>
                  </Label>
                  <Switch checked={appUpdates} onCheckedChange={setAppUpdates} />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* App Settings (Hub) */}
          <Dialog open={appSettingsOpen} onOpenChange={setAppSettingsOpen}>
            <DialogTrigger asChild>
              <div onClick={() => setAppSettingsOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{t("appSettings")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[340px] rounded-3xl">
              <DialogHeader><DialogTitle>{t("appSettings")}</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-2">

                {/* Display */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">{t("display")}</h4>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-muted rounded-xl">
                    {["light", "dark", "system"].map((m) => (
                      <button
                        key={m}
                        onClick={() => setTheme(m)}
                        className={`p-2 rounded-lg text-xs font-medium capitalize flex items-center justify-center gap-1 ${theme === m ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                      >
                        {m === 'light' && <Sun className="w-3 h-3" />}
                        {m === 'dark' && <Moon className="w-3 h-3" />}
                        {m === 'system' && <Smartphone className="w-3 h-3" />}
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Data & Storage */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">{t("dataAndStorage")}</h4>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={handleResetSettings}
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" /> {t("resetAppSettings")}
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 mt-2"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> {t("deleteAccount")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl max-w-[340px]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("deleteWarning")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t("deleteAccountDesc")}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-col gap-2 sm:flex-col">
                        <AlertDialogAction
                          onClick={() => deleteAccountMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                        >
                          {t("confirmDelete")}
                        </AlertDialogAction>
                        <AlertDialogCancel className="rounded-xl mt-0">
                          {t("cancel")}
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

              </div>
            </DialogContent>
          </Dialog>

          {/* Privacy */}
          <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
            <DialogTrigger asChild>
              <div onClick={() => setPrivacyOpen(true)} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-sm">{t("privacySecurity")}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-[340px] rounded-3xl">
              <DialogHeader><DialogTitle>{t("privacySecurity")}</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-2">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase">{t("termsAndConditions")}</h4>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-12 px-4 rounded-xl group hover:border-primary/50 transition-all"
                    onClick={() => setLocation("/terms")}
                  >
                    <span className="text-sm font-medium">{t("viewTerms")}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <Label className="flex flex-col gap-1">
                    <span>{t("localProcessing")}</span>
                    <span className="font-normal text-xs text-muted-foreground">{t("localProcessingDesc")}</span>
                  </Label>
                  <Switch checked={localProcessing} onCheckedChange={setLocalProcessing} />
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Sponsored (Ad-supported) */}
          <div className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-default opacity-80">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-medium text-sm">Plan</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ad-Supported (Free)</span>
            </div>
          </div>

        </div>

        <Button
          variant="destructive"
          className="w-full h-12 rounded-2xl gap-2 shadow-sm mt-8"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4" /> {t("signOut")}
        </Button>

        <p className="text-[10px] text-center text-muted-foreground pt-4 pb-8">
          TrueCost v1.0.4 • {authUser?.username} • {profile?.account_id || "TC-GUEST"}
        </p>
      </div>
    </div>
  );
}
