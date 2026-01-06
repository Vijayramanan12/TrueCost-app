import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, ShieldAlert, BookOpen, Scale, ChevronRight, X, Loader2, CheckCircle, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/language-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function LeaseScanner() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setScanResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      // Defaulting to Maharashtra for now as per previous logic, can be expanded to selector later
      formData.append("state", "Maharashtra");

      const res = await apiRequest("POST", "/api/lease/scan", formData);
      const data = await res.json();

      setScanResult(data);
      setShowAd(true); // Show ad to gate the results
      toast({
        title: "Analysis Complete",
        description: "Rent agreement scanned successfully"
      });
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Failed to analyze document",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const stateRights = [
    { state: "Maharashtra", law: "Rent Control Act 1999", key: "Standard rent fixation" },
    { state: "Delhi", law: "Delhi Rent Act 1995", key: "Eviction protection" },
    { state: "Karnataka", law: "Rent Control Act 2001", key: "Security deposit limits" },
  ];

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          {t("leaseScannerTitle")} <ScanSearch className="w-6 h-6 text-blue-500" />
        </h1>
        <p className="text-muted-foreground">{t("leaseScannerSubtitle")}</p>
      </header>

      {/* Upload Section */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ScanSearch className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="font-heading font-semibold text-lg mb-2">{t("scanYourAgreement")}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t("scanAgreementDesc")}</p>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.txt"
        />

        <Button
          className="w-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={analyzing}
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("analyzing")}
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" /> {t("uploadDocument")}
            </>
          )}
        </Button>
      </div>

      {/* Analysis Result Section */}
      <AnimatePresence>
        {scanResult && !showAd && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 space-y-4"
          >
            <div className="bg-card border rounded-2xl p-6 shadow-sm">
              <h3 className="font-heading font-bold text-xl mb-4 flex items-center gap-2 text-foreground">
                <CheckCircle className="w-5 h-5 text-green-500" /> Analysis Result
              </h3>

              <div className="space-y-4">
                <div className="bg-muted/30 p-4 rounded-xl">
                  <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Applicable Law</p>
                  <p className="font-semibold text-sm">{scanResult.law_name}</p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-bold mb-1">Key Protection</p>
                  <p className="text-sm">{scanResult.key_protection}</p>
                </div>

                {scanResult.red_flags && (
                  <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-100 dark:border-red-900">
                    <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold mb-2 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" /> Red Flags & Issues
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                      {scanResult.red_flags}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ad Modal */}
      <AnimatePresence>
        {showAd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="absolute top-6 right-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAd(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip
              </Button>
            </div>

            <div className="max-w-xs w-full space-y-6">
              <div className="aspect-video bg-muted rounded-2xl overflow-hidden shadow-2xl relative">
                <img
                  src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
                  alt="Advertisement"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-2 left-2 bg-black/50 text-white text-[8px] px-2 py-0.5 rounded uppercase font-bold">Ad</div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold">Moving Made Easy</h2>
                <p className="text-muted-foreground text-sm">Professional packers and movers starting at ₹2,999.</p>
              </div>

              <Button
                className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                onClick={() => setShowAd(false)}
              >
                Get Free Quote
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        <section>
          <h3 className="text-lg font-heading font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> {t("stateSpecificRights")}
          </h3>
          <div className="space-y-3">
            {stateRights.map((item, i) => (
              <motion.div
                key={item.state}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border p-4 rounded-xl flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="font-medium text-sm">{item.state}</div>
                  <div className="text-xs text-muted-foreground">{item.law}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            ))}
          </div>
        </section>

        <section className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-amber-600 flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4" /> {t("commonRedFlags")}
          </h3>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
            <li>{t("redFlag1")}</li>
            <li>{t("redFlag2")}</li>
            <li>{t("redFlag3")}</li>
            <li>{t("redFlag4")}</li>
          </ul>
        </section>

        {/* Mock AdMob Banner */}
        <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-dashed flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest min-h-[50px]">
          {t("sponsored")}
        </div>
      </div>
    </div>
  );
}
