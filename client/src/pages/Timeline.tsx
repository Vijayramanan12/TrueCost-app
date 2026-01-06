import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar as CalendarIcon, Clock, Bell, Plus, MoreVertical, CheckCircle2, Trash2, CalendarDays, DollarSign, FileText, Home, Wrench, AlertCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, isSameMonth, isSameYear } from "date-fns";

// Event type icons mapping
const typeIcons: Record<string, any> = {
  rent: DollarSign,
  lease: FileText,
  maintenance: Wrench,
  general: CalendarDays,
};

const typeColors: Record<string, string> = {
  rent: "from-emerald-400 to-cyan-400",
  lease: "from-violet-400 to-purple-400",
  maintenance: "from-amber-400 to-orange-400",
  general: "from-blue-400 to-indigo-400",
};

// Group events by month
function groupEventsByMonth(events: any[]) {
  const groups: Record<string, any[]> = {};
  events.forEach((event) => {
    if (event.isoDate) {
      const date = parseISO(event.isoDate);
      const key = format(date, "MMMM yyyy");
      if (!groups[key]) groups[key] = [];
      groups[key].push({ ...event, parsedDate: date });
    }
  });
  return groups;
}

export default function Timeline() {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [newStatus, setNewStatus] = useState("upcoming");
  const [newType, setNewType] = useState("general");
  const [newDescription, setNewDescription] = useState("");
  const [newReminder, setNewReminder] = useState("1day");

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
      setNewDescription("");
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
      isoDate: newDate.toISOString(),
      status: newStatus,
      type: newType,
      description: newDescription,
      reminder: newReminder,
    });
  };

  const groupedEvents = groupEventsByMonth(events);

  return (
    <div className="pb-24 pt-8 px-6 max-w-md mx-auto min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">{t("timeline")}</h1>
          <p className="text-muted-foreground">{t("timelineSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="outline" className="rounded-full shadow-sm hover:shadow-md transition-all bg-primary/5 hover:bg-primary/10">
                <Plus className="w-5 h-5 text-primary" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[380px] rounded-[2rem] p-6 text-foreground bg-card border-muted">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  {t("addEvent")}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 pt-4">
                {/* Title Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1">
                    <span className="text-destructive">*</span> {t("eventTitle")}
                  </Label>
                  <Input
                    placeholder="e.g. Rent Due"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="rounded-2xl h-12 bg-muted/50 border-2 border-transparent focus-visible:border-primary transition-all"
                  />
                </div>

                {/* Date Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1">
                    <span className="text-destructive">*</span> {t("eventDate")}
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal rounded-2xl h-12 bg-muted/50 border-2 border-transparent transition-all",
                          !newDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4 opacity-50" />
                        {newDate ? format(newDate, "dd MMM yyyy") : <span className="text-muted-foreground">{t("selectDate")}</span>}
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

                {/* Type Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Event Type
                  </Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-2 border-transparent focus-visible:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="general">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-blue-500" />
                          <span>General</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="rent">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          <span>Rent Payment</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="lease">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-violet-500" />
                          <span>Lease Review</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="maintenance">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-amber-500" />
                          <span>Maintenance</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Status
                  </Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-2 border-transparent focus-visible:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="upcoming">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span>{t("upcoming")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                          <span>{t("pending")}</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-accent" />
                          <span>{t("completed")}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Description Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Description (Optional)
                  </Label>
                  <Textarea
                    placeholder="Add details..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="rounded-2xl bg-muted/50 border-2 border-transparent focus-visible:border-primary transition-all resize-none"
                    rows={3}
                  />
                </div>

                {/* Reminder Field */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1 flex items-center gap-1">
                    <Bell className="w-3 h-3" /> Reminder
                  </Label>
                  <Select value={newReminder} onValueChange={setNewReminder}>
                    <SelectTrigger className="rounded-2xl h-12 bg-muted/50 border-2 border-transparent focus-visible:border-primary transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="none">No Reminder</SelectItem>
                      <SelectItem value="1day">1 Day Before</SelectItem>
                      <SelectItem value="3days">3 Days Before</SelectItem>
                      <SelectItem value="1week">1 Week Before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="mt-6">
                <Button
                  onClick={handleAddEvent}
                  className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  disabled={createEventMutation.isPending || !newTitle || !newDate}
                >
                  {createEventMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Clock className="w-4 h-4" />
                      </motion.div>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {t("saveEvent")}
                    </span>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Timeline */}
      <div className="relative">
        {/* Gradient timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-muted rounded-full" />

        <AnimatePresence mode="popLayout">
          {Object.entries(groupedEvents).map(([month, monthEvents], monthIndex) => (
            <div key={month} className="mb-8">
              {/* Month Header */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: monthIndex * 0.05 }}
                className="relative pl-10 mb-4"
              >
                <div className="absolute left-[10px] top-1/2 -translate-y-1/2 w-20 h-6 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-sm" />
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80 relative z-10">
                  {month}
                </h2>
              </motion.div>

              {/* Events */}
              <div className="space-y-4">
                {(monthEvents as any[]).map((event: any, i: number) => {
                  const TypeIcon = typeIcons[event.type] || CalendarDays;
                  const gradientColor = typeColors[event.type] || typeColors.general;

                  return (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, x: -30, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 30, scale: 0.95 }}
                      transition={{ 
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        delay: i * 0.05 
                      }}
                      className="relative pl-10"
                    >
                      {/* Timeline dot with icon */}
                      <div className="absolute left-[8px] top-4 z-10">
                        <motion.div
                          whileHover={{ scale: 1.2 }}
                          className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center shadow-lg",
                            "bg-gradient-to-br",
                            gradientColor,
                            event.status === 'completed' && "ring-2 ring-accent/30 ring-offset-2 ring-offset-background"
                          )}
                        >
                          <TypeIcon className="w-3 h-3 text-white" />
                        </motion.div>
                      </div>

                      {/* Card */}
                      <motion.div
                        whileHover={{ y: -2 }}
                        className={cn(
                          "relative overflow-hidden rounded-2xl transition-all duration-300",
                          "bg-card border border-muted/50 hover:border-primary/20",
                          event.status === 'completed' && "bg-accent/5 hover:bg-accent/10" ||
                          event.status === 'pending' && "bg-amber-500/5 hover:bg-amber-500/10"
                        )}
                      >
                        {/* Gradient accent bar */}
                        <div className={cn(
                          "absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b",
                          gradientColor
                        )} />

                        <div className="p-5 pl-7">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-bold font-heading text-lg tracking-tight">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                              )}
                            </div>
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

                          <div className="flex items-center gap-3">
                            <div className="flex items-center text-sm text-muted-foreground font-medium bg-muted/50 px-3 py-1.5 rounded-full">
                              <CalendarIcon className="w-3.5 h-3.5 mr-2 opacity-50" />
                              {event.parsedDate ? format(event.parsedDate, "dd MMM") : event.date}
                            </div>
                            {event.reminder && event.reminder !== 'none' && (
                              <div className="flex items-center text-xs text-muted-foreground bg-primary/10 px-2 py-1 rounded-full">
                                <Bell className="w-3 h-3 mr-1 opacity-50" />
                                {event.reminder}
                              </div>
                            )}
                            <span className={cn(
                              "ml-auto text-[10px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full text-white shadow-sm",
                              event.status === 'completed' ? "bg-accent" :
                                event.status === 'upcoming' ? "bg-primary" : "bg-amber-500"
                            )}>
                              {t(event.status as "completed" | "upcoming" | "pending")}
                            </span>
                          </div>

                          {event.status === 'upcoming' && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                            >
                              <Button
                                size="sm"
                                className="w-full mt-4 rounded-xl bg-primary/5 hover:bg-primary/10 text-primary border-none font-bold transition-colors"
                                onClick={() => updateEventMutation.mutate({ id: event.id, data: { status: 'completed' } })}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {t("completed")}?
                              </Button>
                            </motion.div>
                          )}
                        </div>

                        {/* Glow effect */}
                        <div className={cn(
                          "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 pointer-events-none",
                          "bg-gradient-to-r from-transparent via-primary/5 to-transparent",
                          event.status === 'upcoming' && "opacity-100"
                        )} />
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </AnimatePresence>

        {/* Future Placeholder */}
        <div className="relative pl-10 opacity-40 group cursor-default mt-8">
          <div className="absolute left-[10px] top-4 w-5 h-5 rounded-full border-4 border-background bg-muted group-hover:bg-muted-foreground transition-colors" />
          <div className="border-2 border-dashed border-muted rounded-[1.5rem] p-5 text-center text-muted-foreground text-sm font-medium italic bg-muted/30">
            {t("futureEvents")}
          </div>
        </div>
      </div>
    </div>
  );
}

