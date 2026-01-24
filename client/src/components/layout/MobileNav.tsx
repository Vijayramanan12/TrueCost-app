import { Link, useLocation } from "wouter";
import { NAV_ITEMS } from "@/lib/constants";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import { useTranslation, TranslationKeys } from "@/lib/language-context";

export function MobileNav() {
  const [location] = useLocation();
  const { t } = useTranslation();

  const getTranslationKey = (label: string): TranslationKeys => {
    const map: Record<string, TranslationKeys> = {
      "Home": "home",
      "Calculator": "calculator",
      "Timeline": "timeline",
      "Vault": "vault",
      "Lease Scanner": "leaseScanner",
      "Loan Calculator": "loanCalculator"
    };
    return map[label] || (label.toLowerCase() as TranslationKeys);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg pb-safe">
      <nav className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2"
                  />
                )}
              </div>
              <span className="text-[10px] font-medium mt-1">{t(getTranslationKey(item.label))}</span>
            </Link>
          );
        })}
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
            location === "/profile" ? "text-primary" : "text-muted-foreground hover:text-primary/70"
          )}
          data-testid="link-profile"
        >
          <div className="relative">
            <User className={cn("w-6 h-6", location === "/profile" && "stroke-[2.5px]")} />
            {location === "/profile" && (
              <motion.div
                layoutId="nav-indicator"
                className="absolute -bottom-2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2"
              />
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">{t("profile")}</span>
        </Link>
      </nav>
    </div>
  );
}
