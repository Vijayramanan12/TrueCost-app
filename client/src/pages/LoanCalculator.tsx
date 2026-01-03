import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, IndianRupee, Percent, Calendar, ArrowRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";

export default function LoanCalculator() {
  const [amount, setAmount] = useState(500000);
  const [rate, setRate] = useState(10);
  const [tenure, setTenure] = useState(24);

  const monthlyRate = rate / (12 * 100);
  const emi = Math.round(
    (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
    (Math.pow(1 + monthlyRate, tenure) - 1)
  );
  const totalPayable = emi * tenure;
  const totalInterest = totalPayable - amount;

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
          Asset Loan Calc <Calculator className="w-6 h-6 text-amber-500" />
        </h1>
        <p className="text-muted-foreground">Calculate EMI for Gold or Property loans.</p>
      </header>

      <div className="space-y-8">
        <Card className="border-none shadow-lg bg-amber-500 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <CardContent className="p-6 relative z-10 text-center">
            <p className="text-white/80 text-xs font-medium uppercase tracking-wider mb-1">Estimated Monthly EMI</p>
            <div className="text-4xl font-heading font-bold mb-1">₹{emi.toLocaleString('en-IN')}</div>
            <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-[10px] opacity-70 uppercase">Principal</p>
                <p className="font-bold text-sm">₹{amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] opacity-70 uppercase">Interest</p>
                <p className="font-bold text-sm">₹{totalInterest.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 bg-card border p-6 rounded-3xl shadow-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Loan Amount</Label>
              <span className="text-amber-600 font-bold">₹{amount.toLocaleString('en-IN')}</span>
            </div>
            <Slider 
              value={[amount]} 
              onValueChange={([v]) => setAmount(v)} 
              max={2000000} 
              step={10000}
              className="py-2"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Interest Rate (Annual %)</Label>
              <span className="text-amber-600 font-bold">{rate}%</span>
            </div>
            <Slider 
              value={[rate]} 
              onValueChange={([v]) => setRate(v)} 
              max={25} 
              step={0.5}
              className="py-2"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-semibold">Tenure (Months)</Label>
              <span className="text-amber-600 font-bold">{tenure}m</span>
            </div>
            <Slider 
              value={[tenure]} 
              onValueChange={([v]) => setTenure(v)} 
              max={60} 
              step={1}
              className="py-2"
            />
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-2xl flex items-start gap-3">
          <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            This is a mock calculation for asset-backed loans (Gold/Property). Actual interest rates may vary based on bank policies and credit score.
          </p>
        </div>

        <Button className="w-full h-12 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg shadow-md">
          Check Eligibility <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
