import { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/services/chatService';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    conversationLoading: boolean;
}

export function MessageList({ messages, isLoading, conversationLoading }: MessageListProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    if (conversationLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!Array.isArray(messages) || messages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="mb-8 relative z-10"
                >
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <MessageSquare className="h-24 w-24 text-primary relative z-10" strokeWidth={1.5} />
                </motion.div>

                <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="text-2xl font-bold mb-4 tracking-tight text-foreground bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
                >
                    Welcome to TrueCost AI
                </motion.h3>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                    className="text-base max-w-lg leading-relaxed mb-6"
                >
                    Your intelligent financial assistant. Ask me anything about loans, leases, or financial decisions.
                    I can help you calculate EMIs, compare loan options, and provide personalized advice.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.4 }}
                    className="flex flex-wrap gap-2 justify-center max-w-md"
                >
                    {[
                        "Calculate my loan EMI",
                        "Compare lease vs buy options",
                        "What are current interest rates?",
                        "Help with financial planning"
                    ].map((suggestion, index) => (
                        <motion.div
                            key={suggestion}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                        >
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                                onClick={() => {
                                    // This would need to be passed down from parent
                                    // For now, just visual
                                }}
                            >
                                {suggestion}
                            </Button>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-6 max-w-4xl mx-auto pb-4">
                {messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3"
                    >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                            <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <Card className="p-4 flex-1 bg-card/50 backdrop-blur-sm border-border/50 max-w-[100px]">
                            <TypingIndicator />
                        </Card>
                    </motion.div>
                )}
                <div ref={messagesEndRef} />
            </div>
        </ScrollArea>
    );
}
