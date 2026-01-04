import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Bell, Plus, MoreVertical, CheckCircle2, Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "@/lib/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function Timeline() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newStatus, setNewStatus] = useState("upcoming");

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/events"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (event: any) => {
      const res = await apiRequest("POST", "/api/events", event);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsAddOpen(false);
      setNewTitle("");
      setNewDate(undefined);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await apiRequest("PUT", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    }
  });

  const handleAddEvent = () => {
    if (!newDate || !newTitle) return;
    createEventMutation.mutate({
      title: newTitle,
      date: format(newDate, "dd MMM"),
      status: newStatus,
      type: "general"
    });
  };

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-background text-foreground">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">{t("timeline")}</h1>
          <p className="text-muted-foreground">{t("timelineSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-all">
                <Plus className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[340px] rounded-[2rem] p-6 text-foreground bg-card">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl">{t("addEvent")}</DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t("eventTitle")}
                  </Label>
                  <Input
                    placeholder="e.g. Rent Due"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="rounded-2xl h-12 bg-muted/50 border-none focus-visible:ring-primary shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t("eventDate")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-2xl h-12 bg-muted/50 border-none shadow-inner",
                          !newDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4 opacity-50" />
                        {newDate ? format(newDate, "dd MMM yyyy") : <span>{t("eventDate")}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={newDate}
                        onSelect={setNewDate}
                        initialFocus
                        className="p-3"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    {t("eventStatus")}
                  </Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-none shadow-inner">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="upcoming">{t("upcoming")}</SelectItem>
                      <SelectItem value="completed">{t("completed")}</SelectItem>
                      <SelectItem value="pending">{t("pending")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-8">
                <Button
                  onClick={handleAddEvent}
                  className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                  disabled={createEventMutation.isPending || !newTitle || !newDate}
                >
                  {createEventMutation.isPending ? "..." : t("saveEvent")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
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
              "absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center transition-all duration-300",
              event.status === 'completed' ? "bg-accent scale-110 shadow-[0_0_10px_rgba(var(--accent),0.5)]" :
                event.status === 'upcoming' ? "bg-primary scale-110 shadow-[0_0_10px_rgba(var(--primary),0.5)]" : "bg-muted-foreground"
            )} />

            <div className="bg-card border-none p-5 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all duration-300 group ring-1 ring-black/[0.03]">
              <div className="flex items-start justify-between mb-3">
                <div className="font-bold font-heading text-lg tracking-tight group-hover:text-primary transition-colors">{event.title}</div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-8 w-8 -mr-2 rounded-full hover:bg-muted/50">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-xl p-2 bg-card text-foreground">
                    <DropdownMenuItem
                      onClick={() => updateEventMutation.mutate({ id: event.id, data: { status: 'completed' } })}
                      className="gap-3 rounded-xl py-2 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                      </div>
                      <span className="font-medium">{t("completed")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => updateEventMutation.mutate({ id: event.id, data: { status: 'upcoming' } })}
                      className="gap-3 rounded-xl py-2 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium">{t("upcoming")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteEventMutation.mutate(event.id)}
                      className="gap-3 rounded-xl py-2 cursor-pointer transition-colors text-destructive focus:text-destructive"
                    >
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </div>
                      <span className="font-medium">{t("delete")}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center text-sm text-muted-foreground mb-4 font-medium">
                <div className="flex items-center bg-muted/50 px-3 py-1.5 rounded-full">
                  <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-50" />
                  {event.date}
                </div>
                <div className={cn(
                  "ml-auto text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full text-white",
                  event.status === 'completed' ? "bg-accent" :
                    event.status === 'upcoming' ? "bg-primary" : "bg-muted-foreground"
                )}>
                  {t(event.status as "completed" | "upcoming" | "pending")}
                </div>
              </div>

              {event.status === 'upcoming' && (
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border-none font-bold"
                  onClick={() => updateEventMutation.mutate({ id: event.id, data: { status: 'completed' } })}
                >
                  {t("completed")}?
                </Button>
              )}
            </div>
          </motion.div>
        ))}

        {/* Future Placeholder */}
        <div className="relative pl-8 opacity-40 group cursor-default">
          <div className="absolute -left-[9px] top-1 w-5 h-5 rounded-full border-4 border-background bg-muted group-hover:bg-muted-foreground transition-colors" />
          <div className="border-2 border-dashed border-muted rounded-[1.5rem] p-5 text-center text-muted-foreground text-sm font-medium italic">
            {t("futureEvents")}
          </div>
        </div>
      </div>
    </div>
  );
}
