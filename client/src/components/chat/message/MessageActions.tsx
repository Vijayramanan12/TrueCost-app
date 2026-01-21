import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface MessageActionsProps {
    content: string;
    isUser: boolean;
}

export function MessageActions({ content, isUser }: MessageActionsProps) {
    const [copied, setCopied] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            toast({
                title: 'Copied to clipboard',
                description: 'Message content has been copied.',
            });
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast({
                title: 'Failed to copy',
                description: 'Could not copy to clipboard.',
                variant: 'destructive',
            });
        }
    };

    if (isUser) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        >
            <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background shadow-sm"
            >
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-600" />
                ) : (
                    <Copy className="h-3.5 w-3.5" />
                )}
            </Button>
        </motion.div>
    );
}
