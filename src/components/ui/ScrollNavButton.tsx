"use client"

import React, { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowDown } from "lucide-react"

export function ScrollNavButton() {
    const [isVisible, setIsVisible] = useState(false)
    const [isUp, setIsUp] = useState(false)

    const handleScroll = useCallback(() => {
        const scrollY = window.scrollY
        const innerHeight = window.innerHeight
        const documentHeight = document.documentElement.scrollHeight

        // Show button after 200px of scrolling
        setIsVisible(scrollY > 200)

        // Calculate max scrollable height
        const maxScroll = documentHeight - innerHeight
        // Prevent divide by zero if page is short
        if (maxScroll <= 0) {
            setIsUp(false)
            return
        }

        // Determine scroll percentage (0 to 1)
        const scrollProgress = scrollY / maxScroll

        // If past 40% of the page, switch to 'up' direction
        setIsUp(scrollProgress >= 0.4)
    }, [])

    useEffect(() => {
        // Passive listener for better performance
        window.addEventListener("scroll", handleScroll, { passive: true })
        // Initial check
        handleScroll()
        return () => window.removeEventListener("scroll", handleScroll)
    }, [handleScroll])

    const handleClick = () => {
        if (isUp) {
            // Scroll to top
            window.scrollTo({ top: 0, left: 0, behavior: "smooth" })
        } else {
            // Scroll down ~80% of viewport
            window.scrollBy({ top: window.innerHeight * 0.8, left: 0, behavior: "smooth" })
        }
    }

    // Not rendering at all on mobile/tablet (using a matchMedia approach or CSS hidden).
    // We use hidden md:flex here, but we also don't even mount its DOM tree if width < 768px to keep DOM clean as requested.
    const [isDesktop, setIsDesktop] = useState(true)
    useEffect(() => {
        const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 768)
        checkIsDesktop()
        window.addEventListener("resize", checkIsDesktop, { passive: true })
        return () => window.removeEventListener("resize", checkIsDesktop)
    }, [])

    if (!isDesktop) return null

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="fixed bottom-8 right-8 z-[100]"
                >
                    <button
                        onClick={handleClick}
                        className="flex items-center justify-center w-12 h-12 rounded-full bg-white/90 backdrop-blur-xl border border-black/10 shadow-[0_0_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:bg-white transition-all duration-500 ease-out group focus:outline-none focus:ring-2 focus:ring-black/5"
                        aria-label={isUp ? "Scroll to top" : "Scroll to next section"}
                    >
                        <motion.div
                            animate={{ rotate: isUp ? 180 : 0 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="flex items-center justify-center"
                        >
                            <ArrowDown className="w-[18px] h-[18px] text-neutral-500 group-hover:text-black transition-colors duration-300" />
                        </motion.div>
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
