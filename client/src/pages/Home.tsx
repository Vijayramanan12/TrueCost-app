import { motion } from "framer-motion";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { ScanSearch, ShieldCheck, History, ArrowRight, Calculator as CalculatorIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useTranslation } from "@/lib/language-context";

export default function Home() {
  const [, setLocation] = useLocation();
  const { t } = useTranslation();

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-gradient-to-b from-background to-muted/20 dark:from-background dark:to-muted/10 transition-colors duration-300">
      <header className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-heading font-bold text-primary dark:text-foreground mb-2">TrueCost</h1>
          <p className="text-muted-foreground text-lg">{t("homeSubtitle")}</p>
        </motion.div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-6"
      >
        <div className="bg-primary text-primary-foreground p-6 rounded-3xl shadow-lg relative overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.01]" onClick={() => setLocation("/calculator")}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 dark:bg-accent/30 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-accent/40 transition-all duration-500" />

          <div className="relative z-10">
            <h2 className="text-2xl font-heading font-semibold mb-2">{t("calculateRent")}</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-[80%]">
              {t("calculateRentDesc")}
            </p>
            <Button variant="secondary" className="group-hover:translate-x-1 transition-transform">
              {t("startCalculation")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        <section>
          <h3 className="text-lg font-heading font-semibold mb-4 text-foreground/90">{t("quickTools")}</h3>
          <div className="grid gap-3">
            <FeatureCard
              title={t("leaseScanner")}
              description={t("leaseScannerDesc")}
              icon={ScanSearch}
              color="text-blue-600 dark:text-blue-400"
              onClick={() => setLocation("/lease-scanner")}
            />
            <FeatureCard
              title={t("loanCalculator")}
              description={t("loanCalculatorDesc")}
              icon={CalculatorIcon}
              color="text-amber-600 dark:text-amber-400"
              onClick={() => setLocation("/loan-calculator")}
            />
            <FeatureCard
              title={t("vault")}
              description={t("vaultDesc")}
              icon={ShieldCheck}
              color="text-emerald-600 dark:text-emerald-400"
              onClick={() => setLocation("/vault")}
            />
            <FeatureCard
              title={t("timeline")}
              description={t("historyLogDesc")}
              icon={History}
              color="text-amber-600 dark:text-amber-400"
              onClick={() => setLocation("/timeline")}
            />
          </div>
        </section>

        {/* Mock AdMob Banner */}
        <div className="mt-8 p-4 bg-muted/30 dark:bg-muted/20 rounded-xl border border-dashed border-muted-foreground/20 dark:border-muted-foreground/10 flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-widest min-h-[50px]">
          {t("sponsored")}
        </div>
      </motion.div>
    </div>
  );
}
