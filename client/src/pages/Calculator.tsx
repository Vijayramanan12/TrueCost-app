import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_COST_BREAKDOWN, MOCK_LOCAL_STATS } from "@/lib/constants";
import { DollarSign, MapPin, Loader2, Sparkles, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Calculator() {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<typeof MOCK_COST_BREAKDOWN | null>(null);
  const [url, setUrl] = useState("");

  const handleAnalyze = () => {
    setAnalyzing(true);
    // Simulate AI delay
    setTimeout(() => {
      setResult(MOCK_COST_BREAKDOWN);
      setAnalyzing(false);
    }, 2000);
  };

  const totalMonthly = result 
    ? result.baseRent + result.parking + result.petFee + Object.values(result.utilities).reduce((a, b) => a + b, 0)
    : 0;

  const totalMoveIn = result
    ? result.oneTime.deposit + result.oneTime.appFee + result.oneTime.adminFee + result.oneTime.moveIn + result.baseRent
    : 0;

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground">TrueCost Calculator</h1>
        <p className="text-muted-foreground">Reveal the hidden costs of renting.</p>
      </header>

      <Tabs defaultValue="url" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">Paste URL</TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        <TabsContent value="url" className="mt-4 space-y-4">
          <div className="relative">
            <Input 
              placeholder="https://zillow.com/homes/..." 
              className="pl-10 h-12 bg-muted/30 border-muted-foreground/20"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          </div>
          <Button 
            className="w-full h-12 text-lg font-medium" 
            onClick={handleAnalyze} 
            disabled={analyzing || !url}
          >
            {analyzing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Listing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" /> Calculate True Cost
              </>
            )}
          </Button>
        </TabsContent>
        <TabsContent value="manual">
          <div className="p-8 text-center text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
            Manual entry form would go here.
          </div>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
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
                <p className="text-primary-foreground/70 text-sm font-medium uppercase tracking-wider mb-1">True Monthly Cost</p>
                <div className="text-5xl font-heading font-bold mb-2 tracking-tighter">
                  ${totalMonthly.toLocaleString()}
                </div>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/10 text-xs backdrop-blur-md">
                  <span className="opacity-70 mr-1">Base Rent:</span> 
                  <span className="font-bold">${result.baseRent.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>

            {/* Breakdown */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Monthly Breakdown</h3>
              <div className="bg-card border rounded-xl p-4 space-y-3 shadow-sm">
                <Row label="Base Rent" amount={result.baseRent} />
                <Row label="Parking" amount={result.parking} />
                <Row label="Pet Rent" amount={result.petFee} />
                <div className="h-px bg-border my-2" />
                <Row label="Est. Utilities" amount={Object.values(result.utilities).reduce((a, b) => a + b, 0)} highlight />
                <div className="pl-4 space-y-2 mt-2 border-l-2 border-muted">
                  <Row label="Water/Sewer" amount={result.utilities.water} small />
                  <Row label="Electricity" amount={result.utilities.electricity} small />
                  <Row label="Internet" amount={result.utilities.internet} small />
                </div>
              </div>
            </div>

            {/* Move-in Costs */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Move-in Requirements</h3>
              <div className="bg-muted/30 border rounded-xl p-4 space-y-3">
                <Row label="First Month" amount={result.baseRent} />
                <Row label="Security Deposit" amount={result.oneTime.deposit} />
                <Row label="Admin & App Fees" amount={result.oneTime.appFee + result.oneTime.adminFee} />
                <div className="h-px bg-border my-2" />
                <Row label="Total Move-in" amount={totalMoveIn} bold />
              </div>
            </div>

            {/* Local Stats */}
            <div className="space-y-4">
              <h3 className="font-heading font-semibold text-lg">Location Insights</h3>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Safety Score" value={`${MOCK_LOCAL_STATS.safetyScore}/10`} />
                <StatCard label="Walk Score" value={MOCK_LOCAL_STATS.walkScore} />
                <StatCard label="Commute" value={MOCK_LOCAL_STATS.commuteTime} />
                <StatCard label="Power Grid" value={MOCK_LOCAL_STATS.powerReliability} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ label, amount, highlight, small, bold }: { label: string, amount: number, highlight?: boolean, small?: boolean, bold?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${small ? 'text-xs text-muted-foreground' : 'text-sm'} ${highlight ? 'text-accent-foreground font-medium' : ''} ${bold ? 'font-bold text-base' : ''}`}>
      <span>{label}</span>
      <span>${amount.toLocaleString()}</span>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-card border p-3 rounded-xl shadow-sm text-center">
      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-heading font-bold text-foreground">{value}</div>
    </div>
  );
}
