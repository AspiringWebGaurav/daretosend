"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function DeviceGate({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [hasMounted, setHasMounted] = useState<boolean>(false);
  const [typedTitle, setTypedTitle] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const fullTitle = "Desktop Only";

  useEffect(() => {
    setHasMounted(true);

    const checkDevice = () => {
      // 1024px is a common breakpoint for desktop (lg in tailwind)
      setIsMobile(window.innerWidth < 1024);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    window.addEventListener("resize", checkDevice);

    // Cleanup
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (isMobile) {
      let currentIndex = 0;
      let timeoutId: NodeJS.Timeout;

      // Start delay
      const startDelay = setTimeout(() => {
        const typeChar = () => {
          if (currentIndex < fullTitle.length) {
            setTypedTitle(fullTitle.slice(0, currentIndex + 1));
            currentIndex++;
            // 3x slower: ~200ms per character
            timeoutId = setTimeout(typeChar, 200);
          } else {
            setIsTypingComplete(true);
          }
        };
        typeChar();
      }, 200); // 200ms delay before starting

      return () => {
        clearTimeout(startDelay);
        clearTimeout(timeoutId);
      };
    }
  }, [isMobile]);


  // To prevent hydration mismatch, render nothing until mounted on client
  if (!hasMounted) {
    // Return a hidden placeholder that matches the shape of what *might* render
    // Or just null. Null is fine here since it only flashes for a ms before hydration.
    return (
      <div className="min-h-screen bg-black" aria-hidden="true" />
    );
  }

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-blue-950/40 backdrop-blur-3xl p-8 overflow-hidden animate-in fade-in duration-700">
        {/* Soft breathing radial glow behind the text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse [animation-duration:4s]" />

        {/* Main Content */}
        <div className="relative z-10 flex flex-col items-center justify-center max-w-md text-center space-y-10">
          <h1 className="text-3xl font-medium tracking-tight text-white/90 flex items-center gap-[2px]">
            {typedTitle}
            {/* Blinking cursor independent of typing state */}
            <span
              className="inline-block font-light text-blue-400 -translate-y-[2px] animate-[pulse_800ms_cubic-bezier(0.4,0,0.6,1)_infinite] opacity-80"
            >
              |
            </span>
          </h1>

          <div className="space-y-6">
            <p className="text-base text-white/80 font-normal leading-relaxed">
              This application is currently optimized for desktop use.
            </p>
            <p className="text-sm text-white/50 font-normal leading-relaxed max-w-xs mx-auto">
              Gaurav is actively building the platform and mobile optimization will be added in a future update.
            </p>
          </div>
        </div>

        {/* Minimal Footer */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-full text-center">
          <Link
            href="https://gauravpatil.online"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 hover:text-white/70 transition-colors duration-300 font-medium tracking-wide"
          >
            gauravpatil.online
          </Link>
        </div>
      </div>
    );
  }

  // Render the actual app if on desktop
  return <>{children}</>;
}
