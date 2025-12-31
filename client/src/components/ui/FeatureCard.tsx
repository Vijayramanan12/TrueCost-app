import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: string;
  onClick?: () => void;
}

export function FeatureCard({ title, description, icon: Icon, color = "text-primary", onClick }: FeatureCardProps) {
  return (
    <Card 
      className="p-4 flex items-start space-x-4 hover:bg-muted/50 transition-colors cursor-pointer border-none shadow-sm bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <div className={`p-3 rounded-2xl bg-background shadow-sm ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <h3 className="font-heading font-semibold text-lg">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}
