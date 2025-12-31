import { motion } from "framer-motion";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { ScanSearch, ShieldCheck, History, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-heading font-bold text-primary mb-2">TrueCost</h1>
          <p className="text-muted-foreground text-lg">Rent with confidence.</p>
        </motion.div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-primary text-primary-foreground p-6 rounded-3xl shadow-lg relative overflow-hidden group cursor-pointer" onClick={() => setLocation("/calculator")}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent/30 transition-all" />
          
          <div className="relative z-10">
            <h2 className="text-2xl font-heading font-semibold mb-2">Calculate Rent</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-[80%]">
              Paste a listing URL or enter details to see the real monthly cost.
            </p>
            <Button variant="secondary" className="group-hover:translate-x-1 transition-transform">
              Start Calculation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <section>
          <h3 className="text-lg font-heading font-semibold mb-4 text-foreground/90">Quick Tools</h3>
          <div className="grid gap-3">
            <FeatureCard 
              title="Lease Scanner" 
              description="AI-powered analysis of Indian legal terms and renter rights."
              icon={ScanSearch}
              color="text-blue-600"
              onClick={() => setLocation("/lease-scanner")}
            />
            <FeatureCard 
              title="Document Vault" 
              description="Securely store your lease, insurance, and photos."
              icon={ShieldCheck}
              color="text-emerald-600"
              onClick={() => setLocation("/vault")}
            />
            <FeatureCard 
              title="History Log" 
              description="Track maintenance requests and past payments."
              icon={History}
              color="text-amber-600"
              onClick={() => setLocation("/timeline")}
            />
          </div>
        </section>

        {/* Mock AdMob Banner */}
        <div className="mt-8 p-4 bg-muted/30 rounded-xl border border-dashed flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest min-h-[50px]">
          Sponsored Content
        </div>
      </motion.div>
    </div>
  );
}
