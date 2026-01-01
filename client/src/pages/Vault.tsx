import { motion } from "framer-motion";
import { Lock, FileText, Camera, Upload, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_DOCUMENTS } from "@/lib/constants";

export default function Vault() {
  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
       <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            Secure Vault <Lock className="w-6 h-6 text-accent" />
          </h1>
          <p className="text-muted-foreground">Encrypted storage for vital docs.</p>
        </div>
      </header>

      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-accent shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-accent-foreground text-sm">Encrypted Asset Locker</h3>
          <p className="text-xs text-muted-foreground mt-1">Secure storage for Gold loans, Property docs, and Lease agreements. Locally encrypted.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs font-medium">Upload Doc</span>
        </Button>
        <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50">
          <Camera className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs font-medium">Add Photo</span>
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-heading font-semibold">Stored Documents</h3>
        <div className="space-y-3">
          {MOCK_DOCUMENTS.map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border p-4 rounded-xl flex items-center justify-between group cursor-pointer hover:shadow-md transition-all relative"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium text-sm text-foreground">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.date} • {doc.size}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {doc.type === 'asset' && (
                  <div className="bg-amber-500/10 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Alert On
                  </div>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
