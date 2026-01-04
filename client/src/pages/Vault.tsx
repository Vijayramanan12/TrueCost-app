import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, FileText, Camera, Upload, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTranslation } from "@/lib/language-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Document, InsertDocument } from "@shared/schema";

export default function Vault() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const mutation = useMutation({
    mutationFn: async (doc: InsertDocument) => {
      const res = await apiRequest("POST", "/api/documents", doc);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast.success(t("docSaved"));
    },
    onError: () => {
      toast.error(t("docFailed"));
    }
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Simulate file processing/parsing -> Extract metadata
      const newDoc: InsertDocument = {
        name: file.name,
        type: file.type.includes('image') ? 'media' : 'legal',
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: URL.createObjectURL(file) // For now, locally created URL - in real app would be server URL
      };

      mutation.mutate(newDoc);
    }
  };

  const isUploading = mutation.isPending;


  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            {t("vaultTitle")} <Lock className="w-6 h-6 text-accent" />
          </h1>
          <p className="text-muted-foreground">{t("vaultSubtitle")}</p>
        </div>
      </header>

      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-8 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-accent shrink-0 mt-1" />
        <div>
          <h3 className="font-semibold text-accent-foreground text-sm">{t("assetLockerTitle")}</h3>
          <p className="text-xs text-muted-foreground mt-1">{t("assetLockerDesc")}</p>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Button
          variant="outline"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50"
          data-testid="button-upload-doc"
        >
          {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-accent" /> : <Upload className="w-8 h-8 text-muted-foreground" />}
          <span className="text-xs font-medium">{isUploading ? t("encrypting") : t("uploadDoc")}</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          className="h-24 flex flex-col items-center justify-center gap-2 border-dashed border-2 hover:border-primary/50 hover:bg-muted/50"
          data-testid="button-add-photo"
        >
          <Camera className="w-8 h-8 text-muted-foreground" />
          <span className="text-xs font-medium">{t("addPhoto")}</span>
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-heading font-semibold">{t("storedDocuments")}</h3>
        <div className="space-y-3">
          {documents.map((doc, i) => (
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
