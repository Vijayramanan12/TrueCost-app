import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_COST_BREAKDOWN, MOCK_LOCAL_STATS } from "@/lib/constants";
import { DollarSign, MapPin, Loader2, Sparkles, Check, Upload, FileText, Camera, AlertTriangle, Type } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "@/lib/language-context";

export default function Calculator() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof MOCK_COST_BREAKDOWN | null>(null);
  const [listingText, setListingText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  // Manual entry states - null means not set yet (placeholder mode)
  const [manualRent, setManualRent] = useState<number | null>(null);
  const [manualParking, setManualParking] = useState<number | null>(null);
  const [manualPetRent, setManualPetRent] = useState<number | null>(null);
  const [manualWater, setManualWater] = useState<number | null>(null);
  const [manualElectricity, setManualElectricity] = useState<number | null>(null);
  const [manualInternet, setManualInternet] = useState<number | null>(null);
  const [manualTrash, setManualTrash] = useState<number | null>(null);
  const [manualDepositMultiplier, setManualDepositMultiplier] = useState<number | null>(null);
  const [manualAdminFee, setManualAdminFee] = useState<number | null>(null);

  // Helper to get value or default
  const getValue = (val: number | null, defaultVal: number) => val ?? defaultVal;

  const [showAd, setShowAd] = useState(false);
  const [adCountdown, setAdCountdown] = useState(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showAd && adCountdown > 0) {
      timer = setInterval(() => {
        setAdCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showAd, adCountdown]);


  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/analyze", data);
      return res.json();
    },
    onSuccess: (data) => {
      setAdCountdown(5); // Reset countdown
      setShowAd(true);
      setAnalyzing(false);
      setResult(data);
    },
    onError: async (error: any) => {
      setAnalyzing(false);
      try {
        const errorData = await error.json();
        if (errorData.error === "API_KEY_MISSING") {
          setError("Gemini API Key is missing in the backend. Please add GEMINI_API_KEY to your .env file or use Manual entry.");
        } else {
          setError(errorData.message || "Analysis Failed. Please try again.");
        }
      } catch (e) {
        setError("Analysis Failed. Please check your connection and try again.");
      }
    }
  });

  const handleAnalyze = () => {
    if (file && !file.name.toLowerCase().includes("rent") && !file.name.toLowerCase().includes("listing") && !file.name.toLowerCase().includes("house")) {
      setAnalyzing(true);
      setError(null);
      setTimeout(() => {
        setAnalyzing(false);
        setError("AI Analysis Failed: The uploaded document does not appear to be an Indian rental listing. Please upload a valid listing PDF or photo.");
      }, 1500);
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setError(null);

    // Construct payload - use default values only for calculation
    const payload = {
      listingText: listingText,
      manualRent: getValue(manualRent, 45000),
      oneTime: {
        deposit: getValue(manualRent, 45000) * getValue(manualDepositMultiplier, 2),
        adminFee: getValue(manualAdminFee, 2500),
      }
    };

    mutation.mutate(payload);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const totalMonthly = result
    ? (result.baseRent > 0 ? result.baseRent : 0) +
    (result.maintenance > 0 ? result.maintenance : 0) +
    (result.parking > 0 ? result.parking : 0) +
    (result.petFee > 0 ? result.petFee : 0) +
    Object.values(result.utilities).reduce((a: any, b: any) => a + (typeof b === 'number' && b > 0 ? b : 0), 0)
    : 0;

  const totalMoveIn = result
    ? (result.oneTime.deposit > 0 ? result.oneTime.deposit : 0) +
    (result.oneTime.appFee > 0 ? result.oneTime.appFee : 0) +
    (result.oneTime.adminFee > 0 ? result.oneTime.adminFee : 0) +
    (result.oneTime.moveIn > 0 ? result.oneTime.moveIn : 0) +
    (result.baseRent > 0 ? result.baseRent : 0)
    : 0;

  const adminAppFeesSum = result
    ? (result.oneTime.appFee > 0 ? result.oneTime.appFee : 0) + (result.oneTime.adminFee > 0 ? result.oneTime.adminFee : 0)
    : 0;

  const hasValidAdminFees = result && (result.oneTime.appFee > 0 || result.oneTime.adminFee > 0);

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">{t("calculatorTitle")}</h1>
        <p className="text-muted-foreground">{t("calculatorSubtitle")}</p>
      </header>

      <Tabs defaultValue="upload" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">{t("upload")}</TabsTrigger>
          <TabsTrigger value="paste">{t("pasteText")}</TabsTrigger>
          <TabsTrigger value="manual">{t("manual")}</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-muted/10 cursor-pointer hover:bg-muted/20 transition-colors"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,.pdf"
            />
            {file ? (
              <>
                <FileText className="w-10 h-10 text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex gap-2">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{t("uploadPlaceholderTitle")}</p>
                  <p className="text-xs text-muted-foreground">{t("uploadPlaceholderDesc")}</p>
                </div>
              </>
            )}
          </div>
          <Button
            className="w-full h-12 text-lg font-medium"
            onClick={handleAnalyze}
            disabled={analyzing || !file}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("scanningDoc")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> {t("extractAndCalculate")}
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="paste" className="mt-4 space-y-4">
          <div className="relative group">
            <Textarea
              placeholder={t("pastePlaceholder")}
              className="min-h-[160px] bg-muted/30 border-muted-foreground/20 rounded-2xl p-4 pt-10 focus:ring-primary transition-all group-hover:bg-muted/40"
              value={listingText}
              onChange={(e) => setListingText(e.target.value)}
            />
            <FileText className="absolute left-4 top-3 w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <Button
            className="w-full h-12 text-lg font-medium"
            onClick={handleAnalyze}
            disabled={analyzing || !listingText}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> {t("analyzingListing")}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> {t("calculateTrueCost")}
              </>
            )}
          </Button>
        </TabsContent>

        <TabsContent value="manual" className="mt-4 space-y-6">
            <div className="space-y-4 bg-muted/20 p-4 rounded-2xl border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("baseMonthlyRent")}</Label>
                  <span className="font-bold text-primary">₹{manualRent?.toLocaleString('en-IN') ?? '0'}</span>
                </div>
                <Slider
                  value={[manualRent ?? 0]}
                  onValueChange={([v]) => setManualRent(v)}
                  max={200000}
                  step={1000}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("parkingFee")}</Label>
                  <span className="font-bold text-primary">₹{manualParking?.toLocaleString('en-IN') ?? '0'}</span>
                </div>
                <Slider
                  value={[manualParking ?? 0]}
                  onValueChange={([v]) => setManualParking(v)}
                  max={10000}
                  step={500}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("petRent")}</Label>
                  <span className="font-bold text-primary">₹{manualPetRent?.toLocaleString('en-IN') ?? '0'}</span>
                </div>
                <Slider
                  value={[manualPetRent ?? 0]}
                  onValueChange={([v]) => setManualPetRent(v)}
                  max={5000}
                  step={100}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>{t("securityDepositMonths")}</Label>
                  <span className="font-bold text-primary">{manualDepositMultiplier ?? '0'}{t("rentMultiplier")}</span>
                </div>
                <Slider
                  value={[manualDepositMultiplier ?? 0]}
                  onValueChange={([v]) => setManualDepositMultiplier(v)}
                  max={10}
                  step={1}
                />
              </div>
            </div>

            <div className="pt-4 border-t space-y-4">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">{t("estimatedUtilities")}</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>{t("electricity")}</Label>
                    <span>₹{manualElectricity?.toLocaleString('en-IN') ?? '0'}</span>
                  </div>
                  <Slider value={[manualElectricity ?? 0]} onValueChange={([v]) => setManualElectricity(v)} max={10000} step={100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>{t("waterSewer")}</Label>
                    <span>₹{manualWater?.toLocaleString('en-IN') ?? '0'}</span>
                  </div>
                  <Slider value={[manualWater ?? 0]} onValueChange={([v]) => setManualWater(v)} max={2000} step={50} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>{t("internet")}</Label>
                    <span>₹{manualInternet?.toLocaleString('en-IN') ?? '0'}</span>
                  </div>
                  <Slider value={[manualInternet ?? 0]} onValueChange={([v]) => setManualInternet(v)} max={5000} step={100} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>{t("trashMaintenance")}</Label>
                    <span>₹{manualTrash?.toLocaleString('en-IN') ?? '0'}</span>
                  </div>
                  <Slider value={[manualTrash ?? 0]} onValueChange={([v]) => setManualTrash(v)} max={2000} step={50} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>{t("adminFees")}</Label>
                    <span>₹{manualAdminFee?.toLocaleString('en-IN') ?? '0'}</span>
                  </div>
                  <Slider value={[manualAdminFee ?? 0]} onValueChange={([v]) => setManualAdminFee(v)} max={10000} step={500} />
                </div>
              </div>
            </div>

            <Button className="w-full h-12 text-lg font-bold" onClick={handleAnalyze} disabled={analyzing}>
              {t("calculateTrueCost")}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

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
                disabled={adCountdown > 0}
              >
                {adCountdown > 0 ? `${t("skipAd")} (${adCountdown}s)` : t("skipAd")}
              </Button>
            </div>

            <div className="max-w-xs w-full space-y-6">
              <div className="aspect-square bg-muted rounded-3xl overflow-hidden shadow-2xl relative group">
                <img
                  src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800"
                  alt="Advertisement"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl text-left">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Sponsored</p>
                  <p className="text-sm font-bold text-black leading-tight">Home Insurance from ₹499/mo</p>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-heading font-bold">Protect Your New Home</h2>
                <p className="text-muted-foreground text-sm">Get instant coverage for your rental deposit and belongings.</p>
              </div>

              <Button
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                onClick={() => setShowAd(false)}
              >
                Learn More
              </Button>

              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Advertisement</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-4 rounded-xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {error}
            </div>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-6"
          >
            {/* Main Result Card */}
            <Card className="border-none shadow-lg bg-primary text-primary-foreground overflow-hidden relative">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/20 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
              <CardContent className="p-6 relative z-10 text-center">
                <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider mb-1">{t("trueMonthlyCost")}</p>
                <div className="text-5xl font-heading font-bold mb-2 tracking-tighter">
                  ₹{totalMonthly.toLocaleString('en-IN')}
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs backdrop-blur-md">
                  <span className="opacity-70 mr-1">{t("baseMonthlyRent")}:</span>
                  <span className="font-bold">₹{result.baseRent.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">{t("monthlyBreakdown")}</h3>
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                <Row label={t("baseMonthlyRent")} amount={result.baseRent} />
                <Row label={t("parkingFee")} amount={result.parking} />
                <Row label={t("petRent")} amount={result.petFee} />
                <div className="h-px bg-border my-2" />
                <Row label={t("estimatedUtilities")} amount={Object.values(result.utilities).reduce((a: any, b: any) => a + (typeof b === 'number' && b > 0 ? b : 0), 0)} highlight />
                <div className="pl-4 space-y-2 mt-2 border-l-2 border-muted">
                  <Row label={t("waterSewer")} amount={result.utilities.water} small />
                  <Row label={t("electricity")} amount={result.utilities.electricity} small />
                  <Row label={t("internet")} amount={result.utilities.internet} small />
                </div>
              </div>
            </div>

            {/* Move-in Costs */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">{t("moveInRequirements")}</h3>
              <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
                <Row label={t("firstMonth")} amount={result.baseRent} />
                <Row label={t("securityDeposit")} amount={result.oneTime.deposit} />
                <Row label={t("adminAppFees")} amount={hasValidAdminFees ? adminAppFeesSum : -1} />
                <div className="h-px bg-border my-2" />
                <Row label={t("totalMoveIn")} amount={totalMoveIn} bold />
              </div>
            </div>

            {/* Local Stats */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-semibold text-lg">{t("locationInsights")}</h3>
                {result.metadata?.neighborhood && String(result.metadata.neighborhood) !== "-1" && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-lg font-medium">
                    {String(result.metadata.neighborhood)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label={t("safetyScore")} value={`${MOCK_LOCAL_STATS.safetyScore}/10`} />
                <StatCard label={t("walkScore")} value={MOCK_LOCAL_STATS.walkScore} />
                <StatCard
                  label={t("commute")}
                  value={result.metadata?.commuteTime && String(result.metadata.commuteTime) !== "-1"
                    ? String(result.metadata.commuteTime)
                    : t("notSpecified")}
                  isWarning={!result.metadata?.commuteTime || String(result.metadata.commuteTime) === "-1"}
                />
                <StatCard label={t("gridStability")} value={MOCK_LOCAL_STATS.powerReliability} />
              </div>
            </div>

            {/* Mock AdMob Banner */}
            <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-dashed flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest min-h-[50px]">
              {t("sponsored")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, amount, highlight, small, bold }: { label: string, amount: any, highlight?: boolean, small?: boolean, bold?: boolean }) {
  const { t } = useTranslation();

  let displayValue = "";
  let isWarning = false;

  if (amount === -1 || amount === "-1") {
    displayValue = t("notSpecified");
    isWarning = true;
  } else if (amount === "metered") {
    displayValue = "Metered";
  } else if (typeof amount === 'number') {
    displayValue = `₹${amount.toLocaleString('en-IN')}`;
  } else {
    displayValue = String(amount);
  }

  return (
    <div className={`flex justify-between items-center ${small ? 'text-xs text-muted-foreground' : 'text-sm'} ${highlight ? 'text-accent-foreground font-medium' : ''} ${bold ? 'font-bold text-base' : ''}`}>
      <span>{label}</span>
      <span className={isWarning ? "text-amber-500 font-medium italic" : ""}>{displayValue}</span>
    </div>
  );
}

function StatCard({ label, value, isWarning }: { label: string, value: string | number, isWarning?: boolean }) {
  return (
    <div className="bg-card border p-3 rounded-xl shadow-sm text-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-xl font-heading font-bold ${isWarning ? "text-amber-500 italic text-sm" : "text-foreground"}`}>{value}</div>
    </div>
  );
}
