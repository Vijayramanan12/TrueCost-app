import { Link, useLocation } from "wouter";
import { NAV_ITEMS } from "@/lib/constants";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg pb-safe">
      <nav className="flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <a className={cn(
                "flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary/70"
              )}>
                <div className="relative">
                  <item.icon className={cn("w-6 h-6", isActive && "stroke-[2.5px]")} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -bottom-2 left-1/2 w-1 h-1 bg-primary rounded-full -translate-x-1/2"
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </a>
            </Link>
          );
        })}
        <button className="flex flex-col items-center justify-center p-2 rounded-xl text-muted-foreground hover:text-primary/70">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </button>
      </nav>
    </div>
  );
}
