import { useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/services/chatService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { MessageList } from '@/components/chat/MessageList';
import { ChatInput } from '@/components/chat/ChatInput';
import { motion, AnimatePresence } from 'framer-motion';
import { AdBanner } from "@/components/ui/ad-banner";
import { useChatStore } from '@/stores/chatStore';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

export default function Chat() {
    const {
        selectedConversationId,
        isSidebarOpen,
        setSelectedConversationId,
        setIsSidebarOpen,
        setError,
    } = useChatStore();

    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch conversations list directly - NO syncing to store
    const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
        queryKey: ['chat-conversations'],
        queryFn: chatService.getConversations,
    });

    // Fetch selected conversation messages directly - NO syncing to store
    const { data: currentConversation, isLoading: conversationLoading } = useQuery({
        queryKey: ['chat-conversation', selectedConversationId],
        queryFn: () => chatService.getConversation(selectedConversationId!),
        enabled: !!selectedConversationId,
    });

    const currentMessages = currentConversation?.messages || [];

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: ({ message, conversationId }: { message: string; conversationId?: string }) =>
            chatService.sendMessage(message, conversationId),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            queryClient.invalidateQueries({ queryKey: ['chat-conversation', data.conversation_id] });
            if (!selectedConversationId) {
                setSelectedConversationId(data.conversation_id);
            }
        },
        onError: (error: any) => {
            setError(error.message || 'Failed to send message');
            toast({
                title: 'Error',
                description: error.message || 'Failed to send message',
                variant: 'destructive',
            });
        },
    });

    // Delete conversation mutation
    const deleteConversationMutation = useMutation({
        mutationFn: chatService.deleteConversation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['chat-conversations'] });
            setSelectedConversationId(null);
            toast({
                title: 'Success',
                description: 'Conversation deleted',
            });
        },
    });

    // Handlers
    const handleNewChat = () => {
        setSelectedConversationId(null);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleSendMessage = (message: string) => {
        sendMessageMutation.mutate({
            message,
            conversationId: selectedConversationId || undefined,
        });
    };

    const handleDeleteConversation = (id: string) => {
        deleteConversationMutation.mutate(id);
    };

    const handleSelectConversation = (id: string) => {
        setSelectedConversationId(id);
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const shortcuts = useMemo(() => ({
        'ctrl+n': handleNewChat,
        'ctrl+k': () => setIsSidebarOpen(!isSidebarOpen),
    }), [isSidebarOpen, handleNewChat, setIsSidebarOpen]);

    useKeyboardShortcuts(shortcuts);

    // Auto-select first conversation on mobile logic (optional, kept from original)
    useEffect(() => {
        if (conversations.length > 0 && !selectedConversationId && window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    }, [conversations, selectedConversationId]);

    const isLoading = sendMessageMutation.isPending;

    return (
        <div
            className="h-[calc(100vh-64px)] md:h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden relative"
            role="main"
            aria-label="Chat interface"
        >
            {/* Header (Mobile Only for Sidebar Toggle) */}
            <div className="md:hidden border-b bg-card/90 backdrop-blur-xl px-4 py-3 flex items-center gap-3 z-30 sticky top-0 shrink-0 shadow-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="shrink-0 hover:bg-primary/10 transition-colors duration-200"
                    aria-label="Toggle sidebar"
                >
                    {isSidebarOpen ? <ArrowLeft className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                </Button>
                <div className="flex items-center gap-3 flex-1 justify-center mr-8">
                    <img src="/favicon.png" alt="TrueCost Logo" className="h-9 w-9 rounded-full object-contain shadow-sm ring-1 ring-border/50" />
                    <h1 className="text-lg font-bold truncate bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">TrueCost AI</h1>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Sidebar Component */}
                <ChatSidebar
                    conversations={conversations}
                    selectedId={selectedConversationId}
                    onSelect={handleSelectConversation}
                    onNewChat={handleNewChat}
                    onDelete={handleDeleteConversation}
                    isOpen={isSidebarOpen}
                    isLoading={conversationsLoading}
                />

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col w-full min-w-0 bg-background/30 backdrop-blur-[1px] relative z-10 transition-all duration-300 overflow-hidden">
                    <AdBanner />
                    <MessageList
                        messages={currentMessages}
                        isLoading={isLoading}
                        conversationLoading={conversationLoading}
                    />

                    <ChatInput
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                    />
                </div>

                {/* Mobile overlay to close sidebar when clicking outside */}
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-10 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </div >
    );
}
