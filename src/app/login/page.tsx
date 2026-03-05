"use client"
import * as React from "react"
import { Suspense, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase/client"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import Link from "next/link"

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}

function DynamicMessages() {
    const messages = [
        "You explain things really clearly.",
        "You should start teaching more.",
        "I admire your consistency.",
        "Your work last week was outstanding.",
        "Thanks for always helping the team out."
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % messages.length);
        }, 3500);
        return () => clearInterval(timer);
    }, [messages.length]);

    return (
        <div className="h-24 flex items-center justify-start overflow-hidden relative w-full max-w-lg mt-8 hidden lg:flex">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="text-xl md:text-2xl font-medium text-neutral-400 tracking-tight"
                >
                    &ldquo;{messages[currentIndex]}&rdquo;
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = useState(false)
    const [isRedirecting, setIsRedirecting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const reason = searchParams.get("reason")
    const showClaimMessage = reason === "claim"
    const returnTo = searchParams.get("returnTo")

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)

            setIsRedirecting(true)

            // Get the ID token and set it as a cookie for Next.js middleware/backend
            const idToken = await result.user.getIdToken()

            // Send token to our api to set the session cookie
            const res = await fetch('/api/auth/session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ idToken }),
            })

            if (res.ok) {
                const data = await res.json()
                // Brief transition pause for premium feel
                setTimeout(() => {
                    if (data.data?.isNew) {
                        router.push(returnTo ? `/dashboard/onboarding?returnTo=${encodeURIComponent(returnTo)}` : '/dashboard/onboarding')
                    } else {
                        router.push(returnTo ? decodeURIComponent(returnTo) : '/dashboard')
                    }
                }, 800)
            } else {
                setTimeout(() => {
                    router.push(returnTo ? decodeURIComponent(returnTo) : '/dashboard')
                }, 800)
            }
        } catch (err: unknown) {
            console.error("Login Error:", err)
            setIsRedirecting(false)
            setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.")
        } finally {
            // Let isRedirecting handle the loading state visual while we route
            if (!isRedirecting) {
                setIsLoading(false)
            }
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-white text-neutral-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans overflow-hidden">

            {/* Navbar */}
            <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 lg:px-12 backdrop-blur-md bg-white/70 border-b border-neutral-100/50">
                <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-xl text-neutral-900 transition-opacity hover:opacity-80">
                    <div className="h-7 w-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-sm shadow-sm ring-1 ring-neutral-900/10">
                        D
                    </div>
                    DareToSend
                </Link>
            </header>

            {/* Main Content - Two Column Layout */}
            <main className="flex-1 flex flex-col lg:flex-row pt-20">

                {/* Left Side: Product Context */}
                <div className="relative flex-1 hidden lg:flex flex-col justify-center px-12 lg:px-24 bg-neutral-50/50 border-r border-neutral-100/80 overflow-hidden">
                    {/* Subtle background flair */}
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-50/50 blur-3xl opacity-70" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-50/40 blur-3xl opacity-60" />

                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 max-w-xl"
                    >
                        <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-[1.05] mb-6">
                            Dare someone to <br /> send you the truth.
                        </h1>
                        <p className="text-lg text-neutral-500 font-medium leading-relaxed max-w-md">
                            Anonymous feedback. Honest insights. Experience the standard for private, moderated conversations.
                        </p>

                        <DynamicMessages />
                    </motion.div>
                </div>

                {/* Right Side: Auth Interaction */}
                <div className="flex-1 flex flex-col justify-center items-center px-6 lg:px-12 bg-white relative">
                    {/* Background flair for mobile */}
                    <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-50/40 blur-3xl rounded-full lg:hidden" />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="w-full max-w-[360px] relative z-10 flex flex-col items-center"
                    >
                        <div className="w-full space-y-7 flex flex-col items-center">
                            <div className="space-y-3 text-center w-full">
                                {showClaimMessage ? (
                                    <>
                                        <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Claim your link</h2>
                                        <p className="text-neutral-500 font-medium text-base">
                                            To receive feedback, sign in first.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-bold tracking-tight text-neutral-900">Welcome back</h2>
                                        <p className="text-neutral-500 font-medium text-base">
                                            Sign in to your account to continue.
                                        </p>
                                    </>
                                )}
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 w-full text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3"
                                >
                                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{error}</span>
                                </motion.div>
                            )}

                            <div className="w-full pt-2">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="w-full flex items-center justify-center gap-3 h-14 rounded-xl border-neutral-200 text-base font-semibold shadow-sm hover:bg-neutral-50 transition-all relative overflow-hidden"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading || isRedirecting}
                                >
                                    {(isLoading || isRedirecting) ? (
                                        <div className="flex items-center gap-3 text-neutral-600">
                                            <div className="h-5 w-5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                                            {isRedirecting ? "Redirecting to dashboard..." : "Signing you in..."}
                                        </div>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" className="h-5 w-5 absolute left-5" aria-hidden="true">
                                                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                                                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                                                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                                                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
                                            </svg>
                                            Continue with Google
                                        </>
                                    )}
                                </Button>
                            </div>

                            <p className="w-full text-center text-sm text-neutral-400 font-medium pt-2 leading-relaxed">
                                By continuing, you agree to our <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-900 transition-colors font-semibold">Terms</Link> and <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-neutral-900 transition-colors font-semibold">Privacy Policy</Link>.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            {/* Optional Minimal Footer */}
            <footer className="relative z-10 border-t border-neutral-100 bg-white py-6 px-6 lg:px-12 flex items-center justify-between text-xs font-medium text-neutral-400">
                <div>© {new Date().getFullYear()} DareToSend.</div>
                <div className="flex gap-4">
                    <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
                    <Link href="/legal/terms" className="hover:text-neutral-900 transition-colors">Terms</Link>
                    <Link href="/legal/privacy" className="hover:text-neutral-900 transition-colors">Privacy</Link>
                </div>
            </footer>
        </div>
    )
}

