"use client";

import * as React from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Laptop, AlertCircle } from "lucide-react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";

export function DesktopOnlyWarning() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <Card className="w-full max-w-sm overflow-hidden border-primary/20 shadow-2xl bg-background/95 backdrop-blur-lg">
                <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40 w-full" />
                <CardContent className="pt-8 pb-8 px-6 text-center flex flex-col items-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-4 ring-primary/5">
                        <Laptop className="h-8 w-8 text-primary" />
                    </div>
                    <CardTitle className="text-xl mb-2 font-semibold">Desktop Optimized</CardTitle>
                    <CardDescription className="text-base text-muted-foreground leading-relaxed flex flex-col gap-3">
                        <span className="flex items-center gap-2 justify-center text-foreground font-medium">
                            <AlertCircle className="h-4 w-4 text-primary" />
                            Please switch to a desktop device
                        </span>
                        <span>
                            This application is currently optimized exclusively for desktop use. We are actively working on the mobile experience!
                        </span>
                    </CardDescription>
                </CardContent>
            </Card>
        </div>
    );
}

export function DesktopOnlyWrapper({ children }: { children: React.ReactNode }) {
    // Hide UI entirely if window is smaller than standard desktop bounds
    // Breakpoint standard: md = 768px in Tailwind, so below md is mobile/tablet.
    const isMobile = useMediaQuery("(max-width: 767px)");

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    if (!mounted) {
        // Prevent hydration mismatch by rendering nothing initially 
        // until we know the viewport size on the client.
        return <div className="hidden" />;
    }

    if (isMobile) {
        return <DesktopOnlyWarning />;
    }

    return <>{children}</>;
}
