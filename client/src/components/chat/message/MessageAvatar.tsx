import { User, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageAvatarProps {
    isUser: boolean;
}

export function MessageAvatar({ isUser }: MessageAvatarProps) {
    return (
        <div
            className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-all duration-200",
                isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border bg-card group-hover:shadow-md"
            )}
        >
            {isUser ? (
                <User className="h-4 w-4" />
            ) : (
                <MessageSquare className="h-4 w-4" />
            )}
        </div>
    );
}
