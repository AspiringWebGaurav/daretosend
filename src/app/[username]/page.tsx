"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, AlertTriangle, Send, Clock, User, ShieldAlert, Sparkles, LogOut, Copy, Pencil } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/hooks/useAuth"
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { feedbackAuth } from "@/lib/firebase/feedbackClient"

// Firestore-backed history interface
interface SentMessage {
    id: string;
    content: string;
    createdAt: string | null;
    identityMode: string;
    status: string;
}
export default function PublicProfilePage() {
    const params = useParams()
    const username = params.username as string
    const { loading: authLoading } = useAuth()

    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    const composerRef = React.useRef<HTMLDivElement>(null)
    const skipResize = React.useRef(false)
    const [copiedId, setCopiedId] = React.useState<string | null>(null)

    const [message, setMessage] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [isIncognito, setIsIncognito] = React.useState(true)
    const [sent, setSent] = React.useState(false) // temporary success state for animation
    const [error, setError] = React.useState<string | null>(null)
    const [moderationWarning, setModerationWarning] = React.useState<string | null>(null)
    const [profileExists, setProfileExists] = React.useState<boolean | null>(null)
    const [profileDisplayName, setProfileDisplayName] = React.useState<string | null>(null)
    const [checking, setChecking] = React.useState(true)

    // Isolated Feedback Auth State
    const [feedbackAuthActive, setFeedbackAuthActive] = React.useState(false)
    const [feedbackUser, setFeedbackUser] = React.useState<import('firebase/auth').User | null>(null)
    const [showAuthModal, setShowAuthModal] = React.useState(false)
    const [myUsername, setMyUsername] = React.useState<string | null>(null)
    const [isAuthLoading, setIsAuthLoading] = React.useState(false)
    // Eagerly check sessionStorage to prevent Login→Logout flicker
    const [restoringSession, setRestoringSession] = React.useState(() => {
        if (typeof window !== 'undefined') {
            return !!sessionStorage.getItem(`daretosend_feedback_auth_${username}`)
        }
        return false
    })

    // Track feedbackAuth user state independently from main auth
    React.useEffect(() => {
        const unsubscribe = feedbackAuth.onAuthStateChanged(u => setFeedbackUser(u))
        return () => unsubscribe()
    }, [])

    // History state
    const [history, setHistory] = React.useState<SentMessage[]>([])
    const [, setHistoryLoading] = React.useState(false)
    const [isMounted, setIsMounted] = React.useState(false)

    const maxLength = 1000

    // Auto-resize textarea on content change (skipped during Edit & Resend scroll)
    React.useEffect(() => {
        if (skipResize.current) {
            skipResize.current = false
            return
        }
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = `${Math.max(120, textareaRef.current.scrollHeight)}px`;
        }
    }, [message])

    // Load draft on mount
    React.useEffect(() => {
        setIsMounted(true)
        try {
            const storedDraft = localStorage.getItem(`daretosend_draft_${username}`)
            if (storedDraft) {
                setMessage(storedDraft)
            }
        } catch (e) {
            console.error("Failed to load draft from local storage", e)
        }
    }, [username])

    // Persist draft to localStorage on every change
    React.useEffect(() => {
        if (!isMounted) return
        try {
            if (message) {
                localStorage.setItem(`daretosend_draft_${username}`, message)
            } else {
                localStorage.removeItem(`daretosend_draft_${username}`)
            }
        } catch { }
    }, [message, username, isMounted])

    // Fetch history from Firestore when feedback session becomes active
    const fetchHistory = React.useCallback(async () => {
        if (!feedbackAuthActive) return
        setHistoryLoading(true)
        try {
            const res = await fetch(`/api/messages/sent-to/${encodeURIComponent(username)}`, {
                headers: { 'x-auth-context': 'feedback' }
            })
            if (res.ok) {
                const data = await res.json()
                setHistory(data.data?.messages ?? [])
            } else {
                setHistory([])
            }
        } catch {
            setHistory([])
        } finally {
            setHistoryLoading(false)
        }
    }, [feedbackAuthActive, username])

    React.useEffect(() => {
        fetchHistory()
    }, [fetchHistory])

    // Check if username exists
    React.useEffect(() => {
        async function checkProfile() {
            try {
                const res = await fetch(`/api/users/check/${encodeURIComponent(username)}`)
                if (res.ok) {
                    const data = await res.json()
                    setProfileExists(true)
                    if (data.data?.displayName) {
                        setProfileDisplayName(data.data.displayName)
                    }
                } else {
                    setProfileExists(false)
                }
            } catch {
                setProfileExists(false)
            } finally {
                setChecking(false)
            }
        }
        checkProfile()
    }, [username])

    // Auto-restore feedback session from Firebase Auth + sessionStorage on refresh
    React.useEffect(() => {
        if (authLoading) return // Wait for Firebase to resolve
        if (feedbackAuthActive) {
            setRestoringSession(false)
            return
        }
        const persisted = sessionStorage.getItem(`daretosend_feedback_auth_${username}`)
        if (persisted && feedbackUser) {
            const restore = async () => {
                try {
                    const idToken = await feedbackUser.getIdToken()
                    await fetch('/api/auth/session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ idToken, authContext: "feedback" }),
                    })
                    const meRes = await fetch('/api/users/me', {
                        headers: { 'x-auth-context': 'feedback' }
                    })
                    if (meRes.ok) {
                        const meData = await meRes.json()
                        if (meData.data?.username) {
                            setMyUsername(meData.data.username)
                        }
                    }
                    setFeedbackAuthActive(true)
                } catch (e) {
                    console.error("Failed to restore feedback session", e)
                    sessionStorage.removeItem(`daretosend_feedback_auth_${username}`)
                } finally {
                    setRestoringSession(false)
                }
            }
            restore()
        } else {
            // No session to restore
            setRestoringSession(false)
        }
    }, [authLoading, username, feedbackUser, feedbackAuthActive])

    const handleIsolatedAuth = async (forceNewAccount = false) => {
        setIsAuthLoading(true)
        setError(null)
        try {
            if (forceNewAccount) {
                await signOut(feedbackAuth)
            }

            // Always open popup — use feedbackAuth's own user
            const provider = new GoogleAuthProvider()
            const result = await signInWithPopup(feedbackAuth, provider)
            const idToken = await result.user.getIdToken()
            await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken, authContext: "feedback" }),
            })

            // After auth session is established, look up our profile username
            const meRes = await fetch('/api/users/me', {
                headers: { 'x-auth-context': 'feedback' }
            })
            if (meRes.ok) {
                const meData = await meRes.json()
                if (meData.data?.username) {
                    setMyUsername(meData.data.username)
                }
            }

            setFeedbackAuthActive(true)
            setShowAuthModal(false)
            sessionStorage.setItem(`daretosend_feedback_auth_${username}`, 'true')

            // Re-focus the textarea nicely if they weren't restricted
            setTimeout(() => {
                if (textareaRef.current) textareaRef.current.focus()
            }, 100)

        } catch (err: unknown) {
            console.error("Isolated Auth Error", err)
            setError(err instanceof Error ? err.message : "Authentication failed.")
        } finally {
            setIsAuthLoading(false)
        }
    }


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!message.trim() || message.length > maxLength) return

        // Explicit logic for Login-to-Send barrier using Isolated Session
        if (!feedbackAuthActive) {
            setShowAuthModal(true)
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const mode = isIncognito ? "anonymous" : "username"
            const res = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-context': 'feedback'
                },
                body: JSON.stringify({
                    receiverUsername: username,
                    content: message.trim(),
                    identityMode: mode,
                    displayName: null,
                })
            })
            const data = await res.json()
            if (!res.ok) {
                if (res.status === 400 && data.error?.includes("receiverId")) {
                    setProfileExists(false)
                    return
                }
                setError(data.error || "Failed to send message")
                return
            }

            // Success — refetch history from Firestore
            fetchHistory()
            setSent(true)
            setMessage("")

            // Show moderation warning if any
            if (data.data?.warning) {
                setModerationWarning(data.data.warning)
                setTimeout(() => setModerationWarning(null), 8000)
            }

            // Auto revert success animation after 3s
            setTimeout(() => {
                setSent(false)
            }, 3000)

        } catch {
            setError("Something went wrong. Please check your connection and try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (profileExists === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="w-full max-w-lg text-center bg-card border border-border rounded-3xl p-12 shadow-2xl relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-destructive/50 to-destructive" />
                    <div className="mx-auto h-24 w-24 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
                        <AlertTriangle className="h-10 w-10 text-destructive" />
                    </div>
                    <h1 className="text-3xl font-extrabold mb-3 text-foreground tracking-tight">User Not Found</h1>
                    <p className="text-muted-foreground mb-10 text-lg">The profile @{username} does not exist or has been removed.</p>
                    <Link href="/">
                        <Button size="lg" className="rounded-full px-8 text-base shadow-md hover:shadow-lg transition-all">
                            Create Your Own Link
                        </Button>
                    </Link>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground relative overflow-hidden flex flex-col">
            {/* Desktop ambient background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none opacity-50 mix-blend-screen" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none opacity-40 mix-blend-screen" />

            {/* Isolated Feedback Auth Modal */}
            <AnimatePresence>
                {showAuthModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="w-full max-w-md bg-card border border-border/50 shadow-2xl rounded-3xl p-8 relative overflow-hidden ring-1 ring-border/20"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500" />

                            <h2 className="text-2xl font-bold mb-2">Login to Send</h2>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                To prevent abuse, you must be logged in to send messages.
                                <br />Your identity will remain <strong className="text-foreground">{isIncognito ? "anonymous" : "visible"}</strong> to the recipient based on your selection.
                            </p>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm flex items-start gap-3 border border-destructive/20">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <p>{error}</p>
                                </div>
                            )}

                            {feedbackUser ? (
                                <div className="space-y-4">
                                    <Button
                                        onClick={() => handleIsolatedAuth(false)}
                                        disabled={isAuthLoading}
                                        className="w-full h-12 rounded-xl font-medium text-base shadow-md group relative overflow-hidden"
                                    >
                                        {isAuthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                            <>
                                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                                                Continue as {feedbackUser.email || feedbackUser.displayName}
                                            </>
                                        )}
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={() => handleIsolatedAuth(true)}
                                        disabled={isAuthLoading}
                                        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md py-1"
                                    >
                                        Use a different account
                                    </button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => handleIsolatedAuth(true)}
                                    disabled={isAuthLoading}
                                    className="w-full h-12 rounded-xl font-medium text-base shadow-md hover:shadow-lg transition-all"
                                >
                                    {isAuthLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in with Google"}
                                </Button>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowAuthModal(false)
                                    setError(null)
                                }}
                                disabled={isAuthLoading}
                                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                            >
                                Cancel
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Top Navbar */}
            <header className="h-20 w-full max-w-7xl mx-auto px-6 flex items-center justify-between shrink-0 relative z-10 border-b border-border/40">
                <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-xl text-foreground hover:opacity-80 transition-opacity">
                    <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-sm border border-primary/20">D</div>
                    DareToSend
                </Link>
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="text-sm font-mono text-muted-foreground hidden lg:block rounded-full bg-muted/40 px-3 py-1 border border-border/50">
                        SECURE • ANONYMOUS • ENCRYPTED
                    </div>

                    {isAuthLoading || restoringSession ? (
                        <div className="h-9 w-24 bg-muted animate-pulse rounded-full" />
                    ) : (
                        feedbackAuthActive ? (
                            <Button variant="ghost" size="sm" className="rounded-full px-5 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all" onClick={async () => {
                                setFeedbackAuthActive(false)
                                setMyUsername(null)
                                setMessage("")
                                setError(null)
                                setSent(false)
                                setHistory([])
                                sessionStorage.removeItem(`daretosend_feedback_auth_${username}`)
                                await signOut(feedbackAuth)
                                await fetch('/api/auth/session?authContext=feedback', { method: 'DELETE' })
                            }}>
                                <LogOut className="w-4 h-4 mr-2" />
                                Logout
                            </Button>
                        ) : (
                            <Button variant="secondary" size="sm" className="rounded-full px-5 font-semibold shadow-sm" onClick={() => setShowAuthModal(true)}>
                                Login
                            </Button>
                        )
                    )}
                </div>
            </header>

            {/* Middle Content 60/40 Split */}
            <main className="flex-1 w-full max-w-7xl mx-auto px-6 py-8 relative z-10 min-h-0">
                <div className="grid lg:grid-cols-[60fr_40fr] gap-12 lg:gap-16 items-start h-full">

                    {/* Left Column (60%): Composer */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="flex flex-col h-full"
                    >
                        <div className="space-y-3 shrink-0 mb-8 pt-2">
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]">
                                Send feedback to <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                                    {profileDisplayName ? profileDisplayName : `@${username}`}
                                </span>
                            </h1>
                            <p className="text-[17px] text-muted-foreground/90 leading-relaxed max-w-lg mt-4">
                                Share your honest thoughts. This space is heavily moderated to ensure constructive, abuse-free communication.
                            </p>
                        </div>

                        <div ref={composerRef} className="bg-card border border-border/60 shadow-2xl shadow-black/5 dark:shadow-black/20 rounded-[2rem] flex-1 min-h-0 flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-primary/5 hover:border-border">
                            {restoringSession ? (
                                <div className="flex flex-col h-full w-full p-6 animate-pulse">
                                    <div className="flex-1 bg-muted/50 rounded-2xl mb-4" />
                                    <div className="h-4 w-64 bg-muted/50 rounded-full mb-6 mx-3" />
                                    <div className="flex items-center justify-between px-0 py-2 border-t border-border/30">
                                        <div className="h-10 w-48 bg-muted/50 rounded-xl" />
                                        <div className="h-12 w-36 bg-muted/50 rounded-xl" />
                                    </div>
                                </div>
                            ) : feedbackAuthActive && myUsername === username ? (
                                <div className="absolute inset-0 z-20 bg-card flex flex-col items-center justify-center p-8 text-center" >
                                    <div className="h-16 w-16 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
                                        <AlertTriangle className="h-8 w-8 text-destructive" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-2 text-foreground">Self-Send Restricted</h3>
                                    <p className="text-muted-foreground max-w-sm mb-8">
                                        You cannot send feedback to your own profile. This space is intended for collecting messages from others.
                                    </p>
                                    <Link href="/dashboard">
                                        <Button className="rounded-full px-8 shadow-sm h-11">
                                            Go to your dashboard
                                        </Button>
                                    </Link>
                                </div>
                            ) : null}

                            {!restoringSession && (
                                <form onSubmit={handleSubmit} className="relative z-10 flex flex-col h-full w-full">

                                    <div className="p-6 pb-2 flex-1 min-h-0 relative">
                                        <textarea
                                            ref={textareaRef}
                                            placeholder="Type your message here..."
                                            className="h-full w-full resize-none text-lg bg-background/40 border border-border/80 rounded-2xl focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:border-primary/50 p-6 placeholder:text-muted-foreground/50 text-foreground shadow-sm transition-all custom-scrollbar bg-transparent"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            maxLength={maxLength}
                                            autoFocus
                                        />

                                        {/* Identity Mode Helper Text */}
                                        <div className="mt-3 px-3 flex items-center justify-between text-sm">
                                            <AnimatePresence mode="wait">
                                                {isIncognito ? (
                                                    <motion.p
                                                        key="incog"
                                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                        className="text-muted-foreground flex items-center gap-2"
                                                    >
                                                        <ShieldAlert className="w-4 h-4 text-purple-500" />
                                                        Your identity will not be revealed to the recipient.
                                                    </motion.p>
                                                ) : (
                                                    <motion.p
                                                        key="named"
                                                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                                        className="text-muted-foreground flex items-center gap-2"
                                                    >
                                                        <User className="w-4 h-4 text-primary" />
                                                        Your username will be visible to the recipient.
                                                    </motion.p>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Bottom Toolbar */}
                                    <div className="px-6 py-5 bg-card/50 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 shrink-0 mt-4">

                                        <div className="flex bg-background/80 backdrop-blur-sm rounded-[14px] p-1 border border-border/60 shadow-sm w-full sm:w-auto">
                                            <button
                                                type="button"
                                                onClick={() => setIsIncognito(true)}
                                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${isIncognito ? 'bg-card shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <ShieldAlert className="w-4 h-4" />
                                                Incognito
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsIncognito(false)}
                                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${!isIncognito ? 'bg-card shadow-sm text-foreground border border-border/50' : 'text-muted-foreground hover:text-foreground'}`}
                                            >
                                                <User className="w-4 h-4" />
                                                Named
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-6 w-full sm:w-auto">
                                            <div className={`text-xs font-mono font-medium tracking-wider flex items-center gap-1.5 ${message.length > maxLength * 0.9 ? "text-destructive" : "text-muted-foreground/60"}`}>
                                                <span className={message.length > 0 ? "text-foreground" : ""}>{message.length}</span>
                                                <span>/</span>
                                                <span>{maxLength}</span>
                                            </div>

                                            <div className="relative">
                                                <AnimatePresence>
                                                    {sent && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.5, x: 0 }}
                                                            animate={{ opacity: 1, scale: 1, x: -10 }}
                                                            exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                                            className="absolute right-full top-1/2 -translate-y-1/2 mr-4 flex items-center gap-2 text-green-600 dark:text-green-400 whitespace-nowrap bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            <span className="text-sm font-semibold">Message delivered {isIncognito ? 'anonymously' : 'publicly'}</span>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    className="rounded-xl px-8 h-12 font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-base"
                                                    disabled={!message.trim() || message.length > maxLength || isSubmitting}
                                                >
                                                    {isSubmitting ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <><Send className="w-4 h-4 mr-2" /> Dispatch</>
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            )}
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 mt-6 bg-destructive/10 border border-destructive/30 rounded-2xl text-destructive text-sm font-medium flex items-center gap-3 shrink-0"
                                >
                                    <AlertTriangle className="w-5 h-5" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </motion.div>

                    <AnimatePresence>
                        {moderationWarning && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="p-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-600 dark:text-amber-500 text-sm font-medium flex items-start gap-3 shrink-0"
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                                <p className="leading-relaxed">{moderationWarning}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Right Column (40%): History */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                        className="flex flex-col h-full lg:pl-10 lg:border-l border-border/50 min-h-0"
                    >
                        <div className="flex items-center gap-3 mb-6 shrink-0 pt-2">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Messages</h2>
                        </div>

                        <div className="flex-1 relative overflow-hidden bg-muted/10 rounded-3xl border border-border/40 p-2">
                            {!isMounted ? (
                                <div className="animate-pulse space-y-4 p-4">
                                    <div className="h-24 bg-muted/50 rounded-2xl" />
                                    <div className="h-32 bg-muted/50 rounded-2xl" />
                                </div>
                            ) : !feedbackAuthActive ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-8"
                                >
                                    <div className="w-12 h-12 rounded-full bg-background border shadow-sm flex items-center justify-center mb-4">
                                        <LogOut className="w-5 h-5 text-muted-foreground/60 ml-1" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">Login Required</p>
                                    <p className="text-sm text-muted-foreground/60 mt-1 max-w-[200px]">Sign in to view your sent messages history.</p>
                                </motion.div>
                            ) : history.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center p-8"
                                >
                                    <div className="w-12 h-12 rounded-full bg-background border shadow-sm flex items-center justify-center mb-4">
                                        <Sparkles className="w-5 h-5 text-muted-foreground/60" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">No messages sent yet</p>
                                    <p className="text-sm text-muted-foreground/60 mt-1 max-w-[200px]">Messages you send from this account will appear here.</p>
                                </motion.div>
                            ) : (
                                <div className="space-y-3 h-full overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                                    <AnimatePresence initial={false}>
                                        {history.map((msg) => (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                                className="bg-card border shadow-sm rounded-2xl p-5 hover:bg-accent/50 transition-colors group relative overflow-hidden shrink-0"
                                            >
                                                {/* subtle gradient strip on the left based on identity */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${msg.identityMode === 'anonymous' ? 'bg-purple-500/80' : 'bg-primary/80'}`} />

                                                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                                                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-md font-medium ${msg.identityMode === 'anonymous' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-primary/10 text-primary'}`}>
                                                        {msg.identityMode === 'anonymous' ? <ShieldAlert className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                                        {msg.identityMode === 'anonymous' ? 'Incognito' : 'Named'}
                                                    </span>
                                                    <span className="text-muted-foreground">
                                                        {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'just now'}
                                                    </span>
                                                </div>
                                                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap break-words">
                                                    {msg.content}
                                                </p>
                                                <div className="mt-4 pt-3 border-t flex items-center justify-between">
                                                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                                                        Sent {msg.identityMode === 'anonymous' ? 'anonymously' : 'publicly'} to <span className="text-foreground font-bold">{profileDisplayName || `@${username}`}</span>
                                                    </span>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-out">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(msg.content)
                                                                setCopiedId(msg.id)
                                                                setTimeout(() => setCopiedId(null), 1500)
                                                            }}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                                            title="Copy message"
                                                        >
                                                            {copiedId === msg.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setMessage(msg.content)
                                                                requestAnimationFrame(() => {
                                                                    if (textareaRef.current) {
                                                                        textareaRef.current.focus({ preventScroll: true })
                                                                        textareaRef.current.selectionStart = textareaRef.current.value.length
                                                                        textareaRef.current.selectionEnd = textareaRef.current.value.length
                                                                    }
                                                                })
                                                            }}
                                                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                                                            title="Edit & Resend"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </motion.div>

                </div>
            </main>

            {/* Bottom Footer */}
            <footer className="h-16 w-full max-w-7xl mx-auto px-6 flex items-center justify-between shrink-0 border-t border-border/40 text-sm text-muted-foreground">
                <p>© {new Date().getFullYear()} DareToSend</p>
                <div className="flex gap-6">
                    <Link href="/legal/terms" target="_blank" className="hover:text-foreground transition-colors">Terms</Link>
                    <Link href="/legal/privacy" target="_blank" className="hover:text-foreground transition-colors">Privacy</Link>
                </div>
            </footer>
        </div>
    )
}
