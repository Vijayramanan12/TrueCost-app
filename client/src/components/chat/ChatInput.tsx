import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
    const [messageInput, setMessageInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
        }
    }, [messageInput]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!messageInput.trim()) return;
        onSendMessage(messageInput);
        setMessageInput('');

        // Reset height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="border-t bg-card/50 backdrop-blur-md p-4 sticky bottom-0 z-20 pb-[env(safe-area-inset-bottom)]">
            <form
                onSubmit={handleSend}
                className="max-w-4xl mx-auto relative group"
                role="form"
                aria-label="Send message form"
            >
                <div className="relative flex items-end gap-2 bg-background/80 border border-input/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 focus-within:shadow-lg rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md">
                    <textarea
                        ref={textareaRef}
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask TrueCost AI..."
                        disabled={isLoading}
                        rows={1}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none py-3.5 pl-4 pr-12 max-h-[150px] min-h-[50px] scrollbar-thin scrollbar-thumb-muted-foreground/20 leading-relaxed placeholder:text-muted-foreground/60 transition-colors duration-200"
                        aria-label="Message input"
                        aria-describedby="send-button"
                    />

                    <div className="absolute right-2 bottom-2">
                        <Button
                            type="submit"
                            disabled={isLoading || !messageInput.trim()}
                            size="icon"
                            className={cn(
                                "h-9 w-9 rounded-xl transition-all duration-300 shadow-sm",
                                messageInput.trim()
                                    ? "bg-primary text-primary-foreground shadow-md scale-100 hover:scale-105 hover:shadow-lg"
                                    : "bg-muted text-muted-foreground scale-90 opacity-0 pointer-events-none"
                            )}
                            aria-label={isLoading ? "Sending message..." : "Send message"}
                            id="send-button"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                            ) : (
                                <Send className="h-4 w-4 ml-0.5" aria-hidden="true" />
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
