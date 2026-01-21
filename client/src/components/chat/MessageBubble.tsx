import { ChatMessage } from '@/services/chatService';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { MessageAvatar } from './message/MessageAvatar';
import { MessageContent } from './message/MessageContent';
import { MessageActions } from './message/MessageActions';

interface MessageBubbleProps {
    message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.3,
                ease: 'easeOut',
                type: 'spring',
                stiffness: 100,
                damping: 15
            }}
            style={{ willChange: 'transform, opacity' }}
            className={cn(
                "flex items-start gap-3 group",
                isUser ? "flex-row-reverse" : ""
            )}
        >
            <MessageAvatar isUser={isUser} />

            <MessageContent content={message.content} isUser={isUser}>
                <MessageActions content={message.content} isUser={isUser} />
            </MessageContent>
        </motion.div>
    );
}
