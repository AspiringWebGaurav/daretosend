"use client"
import * as React from "react"
import { Suspense } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useRouter, useSearchParams } from "next/navigation"
import { auth } from "@/lib/firebase/client"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import Link from "next/link"

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-muted/20">
                <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const reason = searchParams.get("reason")
    const showClaimMessage = reason === "claim"
    const returnTo = searchParams.get("returnTo")

    const handleGoogleLogin = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(auth, provider)

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
                if (data.data?.isNew) {
                    router.push(returnTo ? `/dashboard/onboarding?returnTo=${encodeURIComponent(returnTo)}` : '/dashboard/onboarding')
                } else {
                    router.push(returnTo ? decodeURIComponent(returnTo) : '/dashboard')
                }
            } else {
                router.push(returnTo ? decodeURIComponent(returnTo) : '/dashboard')
            }
        } catch (err: unknown) {
            console.error("Login Error:", err)
            setError(err instanceof Error ? err.message : "Failed to sign in. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/20 selection:bg-primary selection:text-primary-foreground p-4">
            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 font-bold tracking-tight text-lg">
                <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">D</div>
                DareToSend
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="bg-card text-card-foreground p-8 rounded-2xl border shadow-lg">
                    <div className="text-center space-y-2 mb-8">
                        {showClaimMessage ? (
                            <>
                                <h1 className="text-2xl font-bold tracking-tight">Ohho 👀</h1>
                                <p className="text-sm text-muted-foreground">
                                    Looks like you are not logged in.<br />
                                    To claim your personal link you need to login first.
                                </p>
                            </>
                        ) : (
                            <>
                                <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
                                <p className="text-sm text-muted-foreground">Sign in to your account to continue</p>
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <Button
                            variant="outline"
                            size="lg"
                            className="w-full flex items-center justify-center gap-3 relative h-12"
                            onClick={handleGoogleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" className="h-5 w-5 absolute left-4" aria-hidden="true">
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

                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        By continuing, you agree to our <Link href="/legal/terms" className="underline underline-offset-4 hover:text-foreground">Terms</Link> and <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link>.
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
