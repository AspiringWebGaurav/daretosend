"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, Loader2, MessageSquare, Link2, CheckCircle2, AlertCircle, Check, RefreshCw } from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"

interface SentMessage {
    id: string
    content: string
    receiverUsername: string
    identityMode: string
    displayName: string | null
    status: string
    createdAt: { _seconds?: number } | string | null
}

export default function SentPage() {
    return (
        <ErrorBoundary>
            <SentContent />
        </ErrorBoundary>
    )
}

function SentContent() {
    const { user, loading: authLoading } = useAuth()
    const [messages, setMessages] = React.useState<SentMessage[]>([])
    const [loadingMessages, setLoadingMessages] = React.useState(true)
    const [fetchError, setFetchError] = React.useState<string | null>(null)

    // Workspace State
    const [linkInput, setLinkInput] = React.useState("")
    const [resolvedUsername, setResolvedUsername] = React.useState<string | null>(null)
    const [recipient, setRecipient] = React.useState<{ displayName: string | null } | null>(null)
    const [isValidating, setIsValidating] = React.useState(false)
    const [validationError, setValidationError] = React.useState<string | null>(null)

    // Composer State
    const [messageText, setMessageText] = React.useState("")
    const [identityMode, setIdentityMode] = React.useState<'anonymous' | 'username'>('username')
    const [isSending, setIsSending] = React.useState(false)
    const [sendSuccess, setSendSuccess] = React.useState(false)
    const [sendError, setSendError] = React.useState<string | null>(null)

    // Fetch previously sent messages
    const fetchSent = React.useCallback(async () => {
        setFetchError(null)
        try {
            const res = await fetch("/api/messages/sent")
            if (res.ok) {
                const data = await res.json()
                setMessages(data.data || [])
            } else {
                console.error("[DTS] Sent messages fetch failed:", res.status)
                setFetchError("Failed to load sent messages.")
            }
        } catch (err) {
            console.error("[DTS] Sent messages fetch error:", err)
            setFetchError("Failed to load sent messages. Please check your connection.")
        } finally {
            setLoadingMessages(false)
        }
    }, [])

    React.useEffect(() => {
        if (user) fetchSent()
        else if (!authLoading) setLoadingMessages(false)
    }, [user, authLoading, fetchSent])

    // Debounced Link Validation
    React.useEffect(() => {
        const validateLink = async () => {
            if (!linkInput.trim()) {
                setResolvedUsername(null)
                setRecipient(null)
                setValidationError(null)
                return
            }

            // Extract username from URL if they pasted a full URL
            let parsedUsername = linkInput.trim()
            try {
                if (parsedUsername.startsWith('http')) {
                    const url = new URL(parsedUsername)
                    parsedUsername = url.pathname.replace(/^\//, '').split('/')[0]
                } else if (parsedUsername.startsWith('/')) {
                    parsedUsername = parsedUsername.replace(/^\//, '').split('/')[0]
                }
            } catch {
                // Not a valid URL, treat as raw username
            }

            if (!parsedUsername) {
                setValidationError("Please paste a valid profile link.")
                return
            }

            setIsValidating(true)
            setValidationError(null)

            try {
                // Artificial delay to make validation UI deliberately readable (UX best practice)
                const [res] = await Promise.all([
                    fetch(`/api/users/check/${parsedUsername}`),
                    new Promise(resolve => setTimeout(resolve, 800))
                ])

                if (res.ok) {
                    const json = await res.json()
                    const payload = json.data
                    if (payload && payload.username) {
                        // Self-message protection
                        if (user && payload.uid && payload.uid === user.uid) {
                            setResolvedUsername(null)
                            setRecipient(null)
                            setValidationError("You cannot send a message to your own claimed link.")
                        } else {
                            setResolvedUsername(payload.username)
                            setRecipient({ displayName: payload.displayName })
                            setValidationError(null)
                        }
                    } else {
                        throw new Error("Invalid payload")
                    }
                } else {
                    setResolvedUsername(null)
                    setRecipient(null)
                    setValidationError("This is not a valid claimed link. Please make sure you pasted the correct claimed profile link.")
                }
            } catch {
                setResolvedUsername(null)
                setRecipient(null)
                setValidationError("Failed to verify link. Please try again.")
            } finally {
                setIsValidating(false)
            }
        }

        const timeoutId = setTimeout(validateLink, 500)
        return () => clearTimeout(timeoutId)
    }, [linkInput, user])

    const handleSend = async () => {
        if (!resolvedUsername || !messageText.trim() || isSending) return

        setIsSending(true)
        setSendError(null)
        try {
            const body = {
                receiverUsername: resolvedUsername,
                content: messageText.trim(),
                identityMode,
                displayName: identityMode === 'username' ? (user?.displayName || 'Named User') : null
            }

            const res = await fetch("/api/messages/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            })

            if (res.ok) {
                setSendSuccess(true)
                fetchSent() // Refresh history instantly

                // Reset workspace and scroll to history after 2 seconds
                setTimeout(() => {
                    setSendSuccess(false)
                    setMessageText("")
                    setLinkInput("")
                    setResolvedUsername(null)
                    setRecipient(null)

                    // Smooth scroll to history section
                    setTimeout(() => {
                        const historyEl = document.getElementById("sent-history-section")
                        if (historyEl) {
                            const offsetPosition = historyEl.getBoundingClientRect().top + window.scrollY - 100
                            window.scrollTo({
                                top: offsetPosition,
                                behavior: 'smooth'
                            })
                        }
                    }, 100)
                }, 2000)
            } else {
                console.error("[DTS] Send message failed:", res.status)
                setSendError("Failed to send message. Please try again.")
            }
        } catch (err) {
            console.error("[DTS] Send message error:", err)
            setSendError("Failed to send message. Please check your connection.")
        } finally {
            setIsSending(false)
        }
    }

    const formatDate = (timestamp: { _seconds?: number } | string | null) => {
        if (!timestamp) return ""
        if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && timestamp._seconds) {
            return new Date(timestamp._seconds * 1000).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })
        }
        return new Date(timestamp as string).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
        })
    }

    if (authLoading || loadingMessages) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (fetchError) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground">{fetchError}</p>
                    </div>
                    <Button onClick={() => { setFetchError(null); setLoadingMessages(true); fetchSent(); }} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto pb-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Send Message</h1>
                <p className="text-muted-foreground">Paste a claimed link to verify identity and send feedback.</p>
            </div>

            {/* Workspace Area */}
            <Card className="bg-card shadow-sm border-border/60 overflow-hidden mb-12">
                <div className="p-6 md:p-8 space-y-8">
                    {/* Step 1: Link Input */}
                    <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">1</span>
                            Paste Claimed Link
                        </label>
                        <div className="relative">
                            <div className={`absolute left-3 top-3 transition-colors ${isValidating ? 'text-primary' : resolvedUsername ? 'text-green-500' : validationError ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {isValidating ? <Loader2 className="h-5 w-5 animate-spin" /> : resolvedUsername ? <CheckCircle2 className="h-5 w-5" /> : validationError ? <AlertCircle className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                            </div>
                            <Input
                                value={linkInput}
                                onChange={(e) => setLinkInput(e.target.value)}
                                placeholder="https://daretosend.com/username"
                                className={`pl-10 h-12 text-base transition-colors ${validationError ? 'border-destructive focus-visible:ring-destructive' : ''} ${resolvedUsername && !validationError ? 'border-green-500 bg-green-500/5 focus-visible:ring-green-500/50' : ''}`}
                            />
                        </div>

                        <AnimatePresence mode="wait">
                            {isValidating && (
                                <motion.div
                                    key="checking"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm font-medium text-muted-foreground flex items-center gap-1.5 mt-2"
                                >
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Checking claimed link...
                                </motion.div>
                            )}
                            {!isValidating && validationError && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm font-medium text-destructive flex items-center gap-1.5 mt-2"
                                >
                                    <AlertCircle className="h-4 w-4" />
                                    {validationError}
                                </motion.div>
                            )}
                            {!isValidating && resolvedUsername && !validationError && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-sm font-medium text-green-600 dark:text-green-500 flex items-center gap-1.5 mt-2"
                                >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Claimed link verified
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Step 2: Composer (Only visible if valid recipient) */}
                    <AnimatePresence mode="wait">
                        {resolvedUsername && recipient && !validationError && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-6 pt-6 border-t border-border/50"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <label className="text-sm font-semibold flex items-center gap-2">
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-xs">2</span>
                                            Identity Verified
                                        </label>
                                        <p className="text-sm text-muted-foreground pt-1">
                                            Send message to <strong className="text-foreground">{recipient.displayName || `@${resolvedUsername}`}</strong>
                                        </p>
                                        {sendError && (
                                            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                {sendError}
                                            </div>
                                        )}
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Verified
                                    </Badge>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-muted/30 p-1.5 rounded-lg inline-flex w-full sm:w-auto">
                                        <button
                                            onClick={() => setIdentityMode('username')}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${identityMode === 'username'
                                                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center">👤</span>
                                            Named
                                        </button>
                                        <button
                                            onClick={() => setIdentityMode('anonymous')}
                                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${identityMode === 'anonymous'
                                                ? 'bg-background text-foreground shadow-sm ring-1 ring-border/50'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            <span className="w-4 h-4 flex items-center justify-center">🕵️</span>
                                            Incognito
                                        </button>
                                    </div>

                                    <div className="relative">
                                        <Textarea
                                            value={messageText}
                                            onChange={(e) => setMessageText(e.target.value)}
                                            placeholder="Write your message here..."
                                            className={`min-h-[140px] resize-none text-base p-4 transition-all duration-300 ${sendSuccess ? 'border-primary ring-1 ring-primary/50 bg-primary/5' : ''}`}
                                            disabled={isSending || sendSuccess}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2">
                                        <p className="text-xs text-muted-foreground">
                                            {identityMode === 'username'
                                                ? "Your username and name will be revealed to the recipient."
                                                : "Your identity will be kept completely secret."}
                                        </p>
                                        <Button
                                            onClick={handleSend}
                                            disabled={!messageText.trim() || isSending || sendSuccess}
                                            className={`min-w-[120px] transition-all duration-300 ${sendSuccess ? 'bg-green-600 hover:bg-green-600 text-white' : ''}`}
                                        >
                                            {sendSuccess ? (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="flex items-center"
                                                >
                                                    <Check className="h-4 w-4 mr-2" />
                                                    Message successfully sent
                                                </motion.div>
                                            ) : isSending ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Send className="h-4 w-4 mr-2" />
                                                    Send Message
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>

            {/* History Section */}
            <div id="sent-history-section">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    Sent History
                </h2>

                {messages.length === 0 ? (
                    <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                        <p className="text-sm text-muted-foreground">You haven&apos;t sent any messages yet.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map(msg => (
                            <div key={msg.id} className="p-4 rounded-xl border border-border/50 bg-card hover:border-border transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground">To: @{msg.receiverUsername}</span>
                                        <Badge variant="outline" className="text-[10px] h-4 py-0 px-1.5 font-normal bg-muted/50">
                                            {msg.identityMode === 'anonymous' ? 'Incognito 🕵️' : 'Named 👤'}
                                        </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{formatDate(msg.createdAt)}</span>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2">{msg.content}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
