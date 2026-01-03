import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, Shield, Bell, CreditCard, LogOut, ChevronRight, Settings, Languages, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Profile() {
  const [language, setLanguage] = useState("English");
  
  const languages = [
    { label: "English", value: "English" },
    { label: "Tamil", value: "Tamil" },
    { label: "Kannada", value: "Kannada" },
    { label: "Malayalam", value: "Malayalam" },
    { label: "Telugu", value: "Telugu" },
  ];

  const settings = [
    { icon: Languages, label: "Language", value: language, isLanguage: true },
    { icon: Bell, label: "Notifications", value: "On" },
    { icon: Shield, label: "Privacy & Security", value: "High" },
    { icon: CreditCard, label: "Subscription", value: "Free" },
    { icon: Settings, label: "App Settings", value: "" },
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
            <h2 className="text-xl font-heading font-bold">Arjun Kumar</h2>
            <p className="text-sm opacity-80 flex items-center gap-1">
              <Mail className="w-3 h-3" /> arjun.k@example.com
            </p>
          </div>
        </div>
      </Card>

      <div className="space-y-6">
        <section>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Settings</h3>
          <div className="bg-card border rounded-2xl overflow-hidden shadow-sm">
            {settings.map((item, i) => (
              item.isLanguage ? (
                <Dialog key={item.label}>
                  <DialogTrigger asChild>
                    <button className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-primary" />
                        <span className="font-medium text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.value}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[340px] rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="font-heading">Select Language</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 pt-4">
                      {languages.map((lang) => (
                        <button
                          key={lang.value}
                          onClick={() => setLanguage(lang.value)}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all ${
                            language === lang.value ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                          }`}
                        >
                          <span className="font-medium">{lang.label}</span>
                          {language === lang.value && <Check className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <button 
                  key={item.label}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.value}</span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              )
            ))}
          </div>
        </section>

        <Button variant="destructive" className="w-full h-12 rounded-2xl gap-2 shadow-sm">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>

        <p className="text-[10px] text-center text-muted-foreground">
          TrueCost v1.0.4 • Made by ADER Digital Corporation
        </p>
      </div>
    </div>
  );
}
