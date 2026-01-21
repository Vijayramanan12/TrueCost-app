import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdBannerProps {
    className?: string;
}

export function AdBanner({ className }: AdBannerProps) {
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    return (
        <div className={cn("relative w-full bg-muted/50 border-b p-2 flex items-center justify-center gap-2 min-h-[50px]", className)}>
            {/* --- AD NETWORK INTEGRATION --- 
                1. Replace the content below with your AdSense/AdMob code.
                2. Ensure the script tag is added to your index.html head.
            */}

            {/* Example for Google AdSense:
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                 data-ad-slot="1234567890"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
             <script>
                 (adsbygoogle = window.adsbygoogle || []).push({});
             </script> 
            */}

            {/* PLACEHOLDER CONTENT (Delete this block when real ads are ready) */}
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border border-muted-foreground/20 px-1 rounded">AD</div>
            <p className="text-xs text-muted-foreground text-center">
                Trusted financial products for your future. <span className="underline cursor-pointer hover:text-primary">Learn More</span>
            </p>
            {/* END PLACEHOLDER */}

            <button
                onClick={() => setIsVisible(false)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full transition-colors"
                aria-label="Close Ad"
            >
                <X className="w-3 h-3 text-muted-foreground" />
            </button>
        </div>
    );
}
