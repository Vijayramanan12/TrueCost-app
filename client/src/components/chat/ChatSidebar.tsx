import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Plus, Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { ChatConversation } from '@/services/chatService';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChatSidebarProps {
    conversations: ChatConversation[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onDelete: (id: string) => void;
    isOpen: boolean;
    isLoading: boolean;
}

export function ChatSidebar({
    conversations,
    selectedId,
    onSelect,
    onNewChat,
    onDelete,
    isOpen,
    isLoading
}: ChatSidebarProps) {

    return (
        <div
            className={cn(
                "bg-card/95 backdrop-blur-xl border-r z-20 h-full flex flex-col transition-all duration-300 ease-in-out absolute md:relative w-full md:w-80",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0 md:w-80"
            )}
        >
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                <h2 className="font-semibold text-sm text-foreground/80 tracking-wide">Conversations</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors"
                    onClick={onNewChat}
                    title="New Chat"
                >
                    <Plus className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : !Array.isArray(conversations) || conversations.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2 mt-8">
                        <MessageSquare className="h-8 w-8 opacity-20" />
                        <p>No conversations yet.</p>
                        <Button variant="link" onClick={onNewChat} className="text-primary">Start a new chat</Button>
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {conversations.map((conv, index) => (
                            <motion.div
                                key={conv.id}
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Card
                                    className={cn(
                                        "p-3 cursor-pointer transition-all duration-200 border-transparent hover:bg-accent/50 group relative overflow-hidden hover:shadow-sm",
                                        selectedId === conv.id
                                            ? "bg-accent border-primary/20 shadow-md"
                                            : "bg-transparent hover:border-border/30"
                                    )}
                                    onClick={() => {
                                        console.log("Sidebar: Clicked conversation", conv.id);
                                        onSelect(conv.id);
                                    }}
                                >
                                    {selectedId === conv.id && (
                                        <motion.div
                                            layoutId="selectedIndicator"
                                            className="absolute inset-y-0 left-0 w-1 bg-primary rounded-r-full"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                        />
                                    )}

                                    <div className="flex items-start justify-between gap-2 pl-2">
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "font-medium text-sm truncate transition-colors duration-200",
                                                selectedId === conv.id ? "text-primary" : "text-foreground group-hover:text-foreground"
                                            )}>
                                                {conv.title}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5 transition-colors duration-200 group-hover:text-muted-foreground/80">
                                                {(() => {
                                                    try {
                                                        const date = new Date(conv.updated_at);
                                                        // Check if valid date
                                                        if (isNaN(date.getTime())) return '';

                                                        return date.toLocaleDateString(undefined, {
                                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                        });
                                                    } catch (e) {
                                                        return '';
                                                    }
                                                })()}
                                            </p>
                                        </div>

                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileHover={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive shrink-0 hover:scale-110"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(conv.id);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </motion.div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </ScrollArea>

            {/* Bottom gradient fade */}
            <div className="h-6 bg-gradient-to-t from-card to-transparent pointer-events-none absolute bottom-0 w-full" />
        </div>
    );
}
