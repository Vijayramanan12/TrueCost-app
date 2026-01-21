import { create } from 'zustand';
import { ChatConversation, ChatMessage } from '@/services/chatService';

interface ChatState {
    conversations: ChatConversation[];
    selectedConversationId: string | null;
    isSidebarOpen: boolean;
    isLoading: boolean;
    error: string | null;
    messages: ChatMessage[];
    setConversations: (conversations: ChatConversation[]) => void;
    setSelectedConversationId: (id: string | null) => void;
    setIsSidebarOpen: (open: boolean) => void;
    setIsLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    setMessages: (messages: ChatMessage[]) => void;
    addMessage: (message: ChatMessage) => void;
    updateConversation: (conversation: ChatConversation) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    selectedConversationId: null,
    isSidebarOpen: true,
    isLoading: false,
    error: null,
    messages: [],
    setConversations: (conversations) => set({ conversations }),
    setSelectedConversationId: (selectedConversationId) => {
        set({ selectedConversationId });
        // Update messages when conversation changes
        const conversation = get().conversations.find(c => c.id === selectedConversationId);
        set({ messages: conversation?.messages || [] });
    },
    setIsSidebarOpen: (isSidebarOpen) => set({ isSidebarOpen }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, message]
    })),
    updateConversation: (updatedConversation) => set((state) => ({
        conversations: state.conversations.map(conv =>
            conv.id === updatedConversation.id ? updatedConversation : conv
        )
    })),
}));
