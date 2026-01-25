import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, IndianRupee, TrendingUp, Calendar, Building2, Sparkles, Download, Info, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/lib/language-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const INDIAN_BANKS = [
  "State Bank of India (SBI)",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Punjab National Bank (PNB)",
  "Bank of Baroda",
  "Kotak Mahindra Bank",
  "IDFC FIRST Bank",
  "Yes Bank",
  "IndusInd Bank",
  "Canara Bank",
  "Union Bank of India"
];

const LOAN_TYPES = [
  { value: "home loan", label: "Home Loan" },
  { value: "personal loan", label: "Personal Loan" },
  { value: "car loan", label: "Car Loan" },
  { value: "education loan", label: "Education Loan" },
  { value: "business loan", label: "Business Loan" },
  { value: "gold loan", label: "Gold Loan" },
  { value: "property loan", label: "Loan Against Property" },
  { value: "two wheeler loan", label: "Two Wheeler Loan" }
];

const PAYMENT_FREQUENCIES = [
  { value: "monthly", label: "Monthly" },
  { value: "bi-weekly", label: "Bi-Weekly" },
  { value: "weekly", label: "Weekly" }
];

const CURRENCIES = [
  { value: "INR", symbol: "₹" },
  { value: "USD", symbol: "$" },
  { value: "EUR", symbol: "€" },
  { value: "GBP", symbol: "£" }
];

export default function LoanCalculator() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("basic");

  // Basic inputs - null means placeholder (shows 0 until user enters value)
  const [principal, setPrincipal] = useState<number | null>(null);
  const [annualRate, setAnnualRate] = useState<number | null>(null);
  const [tenureMonths, setTenureMonths] = useState<number | null>(null);
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loanType, setLoanType] = useState("fixed");
  const [currency, setCurrency] = useState("INR");

  // Advanced inputs - null means placeholder
  const [downPayment, setDownPayment] = useState<number | null>(null);
  const [processingFee, setProcessingFee] = useState<number | null>(null);
  const [extraPaymentAmount, setExtraPaymentAmount] = useState<number | null>(null);
  const [extraPaymentMonth, setExtraPaymentMonth] = useState<number | null>(null);

  const [bankName, setBankName] = useState("");
  const [selectedLoanType, setSelectedLoanType] = useState("home loan");
  const [bankAnalysis, setBankAnalysis] = useState<any>(null);
  const [analyzingBank, setAnalyzingBank] = useState(false);

  const [loanResults, setLoanResults] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const [showAd, setShowAd] = useState(false);
  const [adTimer, setAdTimer] = useState(5);

  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol || "₹";

  const getValue = (val: number | null, defaultVal: number) => val ?? defaultVal;

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const params = {
        principal: getValue(principal, 500000),
        annual_rate: getValue(annualRate, 10),
        tenure_months: getValue(tenureMonths, 24),
        payment_frequency: paymentFrequency,
        start_date: startDate,
        loan_type: loanType,
        down_payment: getValue(downPayment, 0),
        fees: { processing: getValue(processingFee, 0) },
        extra_payments: (extraPaymentAmount ?? 0) > 0 ? [{
          payment_number: (extraPaymentMonth ?? 1),
          amount: extraPaymentAmount
        }] : []
      };

      const res = await apiRequest("POST", "/api/loan/calculate", params);
      const data = await res.json();

      setLoanResults(data);
      toast({ title: "Calculation Complete", description: "Loan details calculated successfully" });
      setActiveTab("results");
    } catch (error: any) {
      toast({ title: "Calculation Failed", description: error.message || "Failed to calculate loan", variant: "destructive" });
    } finally {
      setCalculating(false);
    }
  };

  const handleAnalyzeBank = async () => {
    if (!bankName) {
      toast({ title: "Bank Required", description: "Please select a bank to analyze", variant: "destructive" });
      return;
    }

    setAnalyzingBank(true);
    try {
      const res = await apiRequest("POST", "/api/loan/analyze-bank", {
        bank_name: bankName,
        loan_type: selectedLoanType
      });
      const data = await res.json();
      setBankAnalysis(data);
      setShowAd(true);
    } catch (error: any) {
      toast({ title: "Analysis Failed", description: error.message || "Failed to analyze bank", variant: "destructive" });
    } finally {
      setAnalyzingBank(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAd && adTimer > 0) {
      interval = setInterval(() => { setAdTimer((prev) => prev - 1); }, 1000);
    }
    return () => clearInterval(interval);
  }, [showAd, adTimer]);

  const closeAd = () => {
    setShowAd(false);
    setAdTimer(5);
    toast({ title: "Bank Analysis Complete", description: `Analyzed ${bankName} ${selectedLoanType} terms` });
  };

  const handleGetRecommendations = async () => {
    if (!loanResults) {
      toast({ title: "Calculate First", description: "Please calculate the loan first", variant: "destructive" });
      return;
    }

    setLoadingRecommendations(true);
    try {
      const res = await apiRequest("POST", "/api/loan/recommendations", {
        loan_params: loanResults.summary,
        bank_analysis: bankAnalysis,
        user_profile: null
      });
      const data = await res.json();
      setRecommendations(data);
      toast({ title: "Recommendations Ready", description: "AI-powered financial advice generated" });
    } catch (error: any) {
      toast({ title: "Recommendations Failed", description: error.message || "Failed to generate recommendations", variant: "destructive" });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const exportSchedule = () => {
    if (!loanResults?.schedule) return;

    const csv = [
      ["Payment #", "Date", "Payment", "Principal", "Interest", "Extra", "Balance"].join(","),
      ...loanResults.schedule.map((p: any) =>
        [p.payment_number, p.payment_date, p.payment, p.principal, p.interest, p.extra_payment, p.balance].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loan-schedule-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast({ title: "Export Complete", description: "Amortization schedule downloaded" });
  };

  return (
    <div className="pb-24 pt-8 px-6 max-w-4xl mx-auto min-h-screen bg-background relative">
      <AnimatePresence>
        {showAd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-1 bg-gradient-to-r from-amber-500 to-orange-600" />
              <div className="p-6 text-center space-y-6">
                <div className="flex justify-between items-start">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t("sponsored")}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={closeAd} disabled={adTimer > 0}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="py-4">
                  <Sparkles className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Unlock Premium Insights?</h3>
                  <p className="text-muted-foreground text-sm">Get deeper bank analysis and competitor comparisons with TrueCost Premium.</p>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" variant={adTimer > 0 ? "secondary" : "default"} onClick={closeAd} disabled={adTimer > 0}>
                  {adTimer > 0 ? `Wait ${adTimer}s` : t("skipAd")}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          {t("assetLoanCalc")} <Calculator className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-muted-foreground">{t("loanCalcSubtitle")}</p>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-muted/30">
          <TabsTrigger value="basic">{t("basicTab")}</TabsTrigger>
          <TabsTrigger value="advanced">{t("advancedTab")}</TabsTrigger>
          <TabsTrigger value="bank">{t("bankInfoTab")}</TabsTrigger>
          <TabsTrigger value="results">{t("resultsTab")}</TabsTrigger>
          <TabsTrigger value="schedule">{t("scheduleTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />{t("loanAmount")}
                  </Label>
                  <Input type="number" value={principal ?? ""} onChange={(e) => setPrincipal(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("interestRate")}</Label>
                  <Input type="number" step="0.1" value={annualRate ?? ""} onChange={(e) => setAnnualRate(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("tenureMonths")}</Label>
                  <Input type="number" value={tenureMonths ?? ""} onChange={(e) => setTenureMonths(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("paymentFrequency")}</Label>
                  <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYMENT_FREQUENCIES.map(freq => (<SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Calendar className="w-4 h-4" />{t("startDate")}
                  </Label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-12" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("currency")}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map(curr => (<SelectItem key={curr.value} value={curr.value}>{curr.symbol} {curr.value}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              <Button onClick={handleCalculate} disabled={calculating}
                className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-md">
                {calculating ? t("calculating") : t("calculateLoan")}<TrendingUp className="ml-2 w-5 h-5" />
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("downPayment")}</Label>
                  <Input type="number" value={downPayment ?? ""} onChange={(e) => setDownPayment(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("processingFee")}</Label>
                  <Input type="number" value={processingFee ?? ""} onChange={(e) => setProcessingFee(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("extraPaymentAmount")}</Label>
                  <Input type="number" value={extraPaymentAmount ?? ""} onChange={(e) => setExtraPaymentAmount(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("extraPaymentMonth")}</Label>
                  <Input type="number" value={extraPaymentMonth ?? ""} onChange={(e) => setExtraPaymentMonth(e.target.value ? Number(e.target.value) : null)}
                    className="h-12" placeholder="0" />
                </div>
              <div className="bg-muted/30 p-4 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">{t("advancedOptionsDesc")}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank" className="space-y-6">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4" />{t("selectBank")}
                  </Label>
                  <Select value={bankName} onValueChange={setBankName}>
                    <SelectTrigger className="h-12"><SelectValue placeholder="Choose a bank..." /></SelectTrigger>
                    <SelectContent>
                      {INDIAN_BANKS.map(bank => (<SelectItem key={bank} value={bank}>{bank}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">{t("loanProductType")}</Label>
                  <Select value={selectedLoanType} onValueChange={setSelectedLoanType}>
                    <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LOAN_TYPES.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAnalyzeBank} disabled={analyzingBank || !bankName}
                  className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-bold">
                  {analyzingBank ? t("analyzing") : t("analyzeBankTerms")}<Sparkles className="ml-2 w-5 h-5" />
                </Button>
              </div>

              {bankAnalysis && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-6">
                  <h3 className="font-bold text-lg">{t("bankAnalysisResults")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">{t("interestRateRange")}</p>
                      <p className="text-lg font-bold text-green-700 dark:text-green-400">
                        {bankAnalysis.interest_rate_range?.min}% - {bankAnalysis.interest_rate_range?.max}%
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">{t("processingFee")}</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-400">
                        {bankAnalysis.processing_fee?.percentage}%
                      </p>
                    </div>
                  {bankAnalysis.favorable_terms && bankAnalysis.favorable_terms.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-xl">
                      <p className="text-sm font-semibold mb-2">{t("favorableTerms")}:</p>
                      <ul className="text-xs space-y-1">
                        {bankAnalysis.favorable_terms.map((term: string, i: number) => (
                          <li key={i} className="flex items-start gap-2">
                            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" />{term}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {loanResults ? (
            <>
              <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <CardContent className="p-6 text-center">
                  <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">{t("regularPayment")}</p>
                  <div className="text-4xl font-heading font-bold mb-4">
                    {currencySymbol}{loanResults.summary.regular_payment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">{t("totalPrincipal")}</p>
                      <p className="font-bold text-sm">{currencySymbol}{loanResults.summary.total_principal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">{t("totalInterest")}</p>
                      <p className="font-bold text-sm">{currencySymbol}{loanResults.summary.total_interest.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] opacity-70 uppercase">{t("totalCost")}</p>
                      <p className="font-bold text-sm">{currencySymbol}{loanResults.summary.total_cost.toLocaleString('en-IN')}</p>
                    </div>
                </CardContent>
              </Card>
              <Button onClick={handleGetRecommendations} disabled={loadingRecommendations}
                className="w-full h-12 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white font-bold">
                {loadingRecommendations ? t("generating") : t("getAiRecommendations")}<Sparkles className="ml-2 w-5 h-5" />
              </Button>
              {recommendations && (
                <Card className="border-none shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-500" />{t("aiRecommendations")}
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-xl">
                      <p className="text-sm font-semibold mb-2">{t("overallAssessment")}</p>
                      <p className="text-xs text-muted-foreground">
                        Affordability: <span className="font-bold capitalize">{recommendations.overall_assessment?.affordability_rating}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Recommendation: <span className="font-bold capitalize">{recommendations.overall_assessment?.recommendation}</span>
                      </p>
                    </div>
                    {recommendations.quick_wins && recommendations.quick_wins.length > 0 && (
                      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-xl">
                        <p className="text-sm font-semibold mb-2">{t("quickWins")}:</p>
                        <ul className="text-xs space-y-1">
                          {recommendations.quick_wins.map((win: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <ChevronRight className="w-3 h-3 mt-0.5 shrink-0 text-green-600" />{win}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t("calculateFirst")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          {loanResults?.schedule ? (
            <>
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{t("amortizationSchedule")}</h3>
                <Button onClick={exportSchedule} variant="outline" className="rounded-xl">
                  <Download className="w-4 h-4 mr-2" />{t("exportCsv")}
                </Button>
              </div>
              <Card className="border-none shadow-lg">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/30">
                        <tr>
                          <th className="p-3 text-left">#</th>
                          <th className="p-3 text-left">{t("date")}</th>
                          <th className="p-3 text-right">{t("payment")}</th>
                          <th className="p-3 text-right">{t("principal")}</th>
                          <th className="p-3 text-right">{t("interest")}</th>
                          <th className="p-3 text-right">{t("balance")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loanResults.schedule.slice(0, 12).map((payment: any) => (
                          <tr key={payment.payment_number} className="border-b">
                            <td className="p-3">{payment.payment_number}</td>
                            <td className="p-3">{payment.payment_date}</td>
                            <td className="p-3 text-right font-mono">
                              {currencySymbol}{payment.payment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono text-green-600">
                              {currencySymbol}{payment.principal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono text-red-600">
                              {currencySymbol}{payment.interest.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-3 text-right font-mono">
                              {currencySymbol}{payment.balance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {loanResults.schedule.length > 12 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Showing first 12 of {loanResults.schedule.length} payments. Export for full schedule.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">{t("calculateFirstSchedule")}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
