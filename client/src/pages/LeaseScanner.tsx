import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanSearch, ShieldAlert, BookOpen, Scale, ChevronRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LeaseScanner() {
  const [analyzing, setAnalyzing] = useState(false);
  const [showAd, setShowAd] = useState(false);

  const handleUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowAd(true);
    }, 1500);
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
          Lease Scanner <ScanSearch className="w-6 h-6 text-blue-500" />
        </h1>
        <p className="text-muted-foreground">AI analysis of Indian rental agreements.</p>
      </header>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mb-8 text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ScanSearch className="w-8 h-8 text-blue-500" />
        </div>
        <h2 className="font-heading font-semibold text-lg mb-2">Scan Your Agreement</h2>
        <p className="text-sm text-muted-foreground mb-4">Upload your lease to check for unfair clauses and verify state-specific rights.</p>
        <Button className="w-full" onClick={handleUpload} disabled={analyzing}>
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
            </>
          ) : "Upload Document"}
        </Button>
      </div>

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
            <Scale className="w-5 h-5 text-primary" /> State-Specific Rights
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
            <ShieldAlert className="w-4 h-4" /> Common Red Flags (India)
          </h3>
          <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
            <li>Excessive security deposit (should be 2-3 months in most cities).</li>
            <li>Lack of clear maintenance responsibility clauses.</li>
            <li>Vague notice period for mid-term evictions.</li>
            <li>Inconsistent utility billing methods.</li>
          </ul>
        </section>

        {/* Mock AdMob Banner */}
        <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-dashed flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest min-h-[50px]">
          Sponsored Content
        </div>
      </div>
    </div>
  );
}
