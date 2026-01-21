import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface MessageContentProps {
    content: string;
    isUser: boolean;
    children?: React.ReactNode;
}

export function MessageContent({ content, isUser, children }: MessageContentProps) {
    return (
        <div className="max-w-[85%] relative">
            <Card
                className={cn(
                    "p-4 shadow-sm border-0 transition-all duration-200 hover:shadow-md",
                    isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/70"
                )}
            >
                {isUser ? (
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
                ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:p-0 prose-pre:bg-transparent prose-headings:text-foreground prose-p:text-foreground/90">
                        <ReactMarkdown
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <div className="rounded-md overflow-hidden my-2 border border-border/50 shadow-sm">
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={match[1]}
                                                PreTag="div"
                                                customStyle={{ margin: 0, padding: '1rem' }}
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        </div>
                                    ) : (
                                        <code
                                            className={cn(
                                                "px-1.5 py-0.5 rounded text-xs font-mono",
                                                "bg-muted text-foreground border border-border/50"
                                            )}
                                            {...props}
                                        >
                                            {children}
                                        </code>
                                    );
                                },
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                )}
            </Card>
            {children}
        </div>
    );
}
