import { ChevronLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export default function Terms() {
    const [, setLocation] = useLocation();

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-b z-50 px-6 py-4 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    onClick={() => window.history.back()}
                >
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-lg font-bold">Terms of Service</h1>
            </header>

            <main className="pt-24 px-6 max-w-2xl mx-auto space-y-8">
                <section className="space-y-4">
                    <h2 className="text-2xl font-black tracking-tighter uppercase">1. TrueCost AI Services</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        TrueCost AI provides rental analysis, lease scanning, and financial calculation tools. Our AI insights are estimates based on provided data and Indian rental laws.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-black tracking-tighter uppercase">2. Privacy & Data</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        We prioritize local processing. Documents scanned in the Vault are stored according to your sync preferences. We do not sell your personal data to third parties.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-black tracking-tighter uppercase">3. Disclaimers</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        The analysis provided by the "Lease Scanner" is for informational purposes only and does not constitute legal advice. Users are encouraged to consult with legal professionals for binding agreements.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-black tracking-tighter uppercase">4. Account Termination</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        Users can permanently delete their account and data at any time through the App Settings. Once deleted, this data cannot be recovered.
                    </p>
                </section>

                <div className="pt-8 border-t">
                    <p className="text-[10px] text-muted-foreground text-center italic">
                        Last Updated: January 2026 • TrueCost AI Team
                    </p>
                </div>
            </main>
        </div>
    );
}
