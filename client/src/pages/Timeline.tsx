import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { Event } from "@shared/schema";

export default function Timeline() {
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Timeline</h1>
          <p className="text-muted-foreground">Track your tenancy journey.</p>
        </div>
        <Button size="icon" variant="ghost">
          <Bell className="w-5 h-5" />
        </Button>
      </header>

      <div className="relative border-l-2 border-muted ml-3 space-y-8 pb-8">
        {events.map((event: any, i: number) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="relative pl-8"
          >
            <div className={cn(
              "absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center",
              event.status === 'completed' ? "bg-accent" :
                event.status === 'upcoming' ? "bg-primary" : "bg-muted-foreground"
            )} />

            <div className="bg-card border p-4 rounded-xl shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div className="font-semibold font-heading text-lg">{event.title}</div>
                <div className={cn(
                  "text-[10px] uppercase font-bold px-2 py-0.5 rounded-full",
                  event.status === 'completed' ? "bg-accent/10 text-accent" :
                    event.status === 'upcoming' ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {event.status}
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground mb-4">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {event.date}
              </div>

              {event.status === 'upcoming' && (
                <Button size="sm" className="w-full">Set Reminder</Button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Future Placeholder */}
        <div className="relative pl-8 opacity-50">
          <div className="absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 border-background bg-muted" />
          <div className="border-2 border-dashed border-muted rounded-xl p-4 text-center text-muted-foreground text-sm">
            Future events will appear here
          </div>
        </div>
      </div>
    </div>
  );
}
