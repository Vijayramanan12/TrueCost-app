import { apiRequest } from "../lib/queryClient";
import { z } from "zod";

export const ChatMessageSchema = z.object({
    id: z.string(),
    conversation_id: z.string(),
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
    created_at: z.string(),
});

export const ChatConversationSchema = z.object({
    id: z.string(),
    user_id: z.string(),
    title: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    messages: z.array(ChatMessageSchema).optional(),
});

export const SendMessageResponseSchema = z.object({
    conversation_id: z.string(),
    user_message: ChatMessageSchema.optional(),
    assistant_message: ChatMessageSchema.optional(),
    limit_reached: z.boolean().optional(),
    message: z.string().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type ChatConversation = z.infer<typeof ChatConversationSchema>;
export type SendMessageResponse = z.infer<typeof SendMessageResponseSchema>;

export const chatService = {
    // Get all conversations
    getConversations: async (): Promise<ChatConversation[]> => {
        const response = await apiRequest('GET', '/api/chat/conversations');
        return response.json();
    },

    // Get specific conversation with messages
    getConversation: async (conversationId: string): Promise<ChatConversation> => {
        const response = await apiRequest('GET', `/api/chat/conversation/${conversationId}`);
        return response.json();
    },

    // Create new conversation
    createConversation: async (title?: string): Promise<ChatConversation> => {
        const response = await apiRequest('POST', '/api/chat/conversation/new', {
            title: title || 'New Chat'
        });
        return response.json();
    },

    // Send message and get AI response
    sendMessage: async (message: string, conversationId?: string): Promise<SendMessageResponse> => {
        const response = await apiRequest('POST', '/api/chat/send', {
            message,
            conversation_id: conversationId
        });
        return response.json();
    },

    // Delete conversation
    deleteConversation: async (conversationId: string): Promise<void> => {
        await apiRequest('DELETE', `/api/chat/conversation/${conversationId}`);
    },

    // Update conversation title
    updateConversationTitle: async (conversationId: string, title: string): Promise<ChatConversation> => {
        const response = await apiRequest('PUT', `/api/chat/conversation/${conversationId}/title`, {
            title
        });
        return response.json();
    },
};
