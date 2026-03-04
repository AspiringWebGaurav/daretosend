"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, Copy, Loader2, Sparkles, X, AlertCircle, ArrowRight } from "lucide-react"

type AvailabilityStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error"

function generateSuggestions(base: string): string[] {
    const suffixes = ["_1", "_x", "hq", "_official", "_real", `_${Math.floor(Math.random() * 99) + 1}`]
    return suffixes
        .map((s) => {
            const suggestion = base.endsWith("_") ? base.slice(0, -1) + s : base + s
            return suggestion.slice(0, 20)
        })
        .filter((s, i, arr) => s.length >= 3 && arr.indexOf(s) === i)
        .slice(0, 4)
}

export default function OnboardingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnTo = searchParams.get("returnTo")
    const [username, setUsername] = React.useState("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [submitError, setSubmitError] = React.useState<string | null>(null)
    const [claimedLink, setClaimedLink] = React.useState<string | null>(null)
    const [copied, setCopied] = React.useState(false)

    // Real-time availability
    const [status, setStatus] = React.useState<AvailabilityStatus>("idle")
    const [suggestions, setSuggestions] = React.useState<string[]>([])
    const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
    const abortRef = React.useRef<AbortController | null>(null)

    // Validation
    const isValidFormat = /^[a-z0-9_]*$/.test(username)
    const isLongEnough = username.length >= 3
    const isTooLong = username.length > 20
    const hasInvalidChars = username.length > 0 && !isValidFormat

    const canClaim = status === "available" && isLongEnough && !isTooLong && isValidFormat && !isSubmitting

    // Debounced availability check
    React.useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        if (abortRef.current) abortRef.current.abort()

        setSuggestions([])
        setSubmitError(null)

        if (!username || username.length < 3 || !isValidFormat || isTooLong) {
            if (hasInvalidChars) {
                setStatus("invalid")
            } else {
                setStatus("idle")
            }
            return
        }

        setStatus("checking")

        debounceRef.current = setTimeout(async () => {
            const controller = new AbortController()
            abortRef.current = controller

            try {
                const res = await fetch(`/api/users/check/${encodeURIComponent(username)}`, {
                    signal: controller.signal,
                })

                if (controller.signal.aborted) return

                if (res.ok) {
                    // Username exists = taken
                    setStatus("taken")
                    setSuggestions(generateSuggestions(username))
                } else if (res.status === 404) {
                    // Not found = available
                    setStatus("available")
                    setSuggestions([])
                } else {
                    setStatus("error")
                }
            } catch (e: unknown) {
                if (e instanceof Error && e.name === "AbortError") return
                setStatus("error")
            }
        }, 400)

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [username, isValidFormat, isTooLong, hasInvalidChars])

    const handleRawInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Allow typing anything but show invalid feedback
        const val = e.target.value.toLowerCase()
        if (/[^a-z0-9_]/.test(val)) {
            // Still set the cleaned value but flash the invalid state
            setUsername(val.replace(/[^a-z0-9_]/g, ""))
            setStatus("invalid")
            setTimeout(() => {
                if (username.length < 3) setStatus("idle")
            }, 1500)
        } else {
            setUsername(val)
        }
    }

    const handleClaim = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canClaim) return

        setIsSubmitting(true)
        setSubmitError(null)

        try {
            const res = await fetch("/api/users/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: username.trim() }),
            })

            const data = await res.json()

            if (!res.ok) {
                if (res.status === 409 && data.error?.includes("already taken")) {
                    setStatus("taken")
                    setSuggestions(generateSuggestions(username))
                    setSubmitError("Someone just claimed this username. Try another one.")
                } else {
                    setSubmitError(data.error || "Failed to claim username")
                }
                return
            }

            // Use the exactly generated transactional link returned from the server
            setClaimedLink(data.data.claimedUrl)
        } catch {
            setSubmitError("Network error. Please check your connection and try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopy = async () => {
        if (!claimedLink) return
        await navigator.clipboard.writeText(claimedLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const selectSuggestion = (s: string) => {
        setUsername(s)
        setSuggestions([])
    }

    // Status indicator component
    const StatusIndicator = () => {
        if (hasInvalidChars || status === "invalid") {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-destructive"
                >
                    <X className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Only letters, numbers, and underscores allowed</span>
                </motion.div>
            )
        }

        if (username.length > 0 && username.length < 3) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-muted-foreground"
                >
                    <span className="text-xs">Minimum 3 characters ({3 - username.length} more)</span>
                </motion.div>
            )
        }

        if (isTooLong) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-destructive"
                >
                    <X className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Maximum 20 characters</span>
                </motion.div>
            )
        }

        switch (status) {
            case "checking":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-muted-foreground"
                    >
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="text-xs font-medium">Checking availability...</span>
                    </motion.div>
                )
            case "available":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        className="flex items-center gap-1.5 text-green-600"
                    >
                        <Check className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Username available</span>
                    </motion.div>
                )
            case "taken":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-destructive"
                    >
                        <X className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Username already taken</span>
                    </motion.div>
                )
            case "error":
                return (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-1.5 text-yellow-600"
                    >
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">Could not check. Try again.</span>
                    </motion.div>
                )
            default:
                return username.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                        3-20 characters. Letters, numbers, and underscores only.
                    </span>
                ) : null
        }
    }

    // Input border color based on status
    const inputBorderClass = (() => {
        if (hasInvalidChars || status === "taken" || status === "invalid") return "border-destructive/50 focus-within:border-destructive"
        if (status === "available") return "border-green-500/50 focus-within:border-green-500"
        if (status === "checking") return "border-primary/30 focus-within:border-primary/50"
        return "border-border focus-within:border-primary/50"
    })()

    return (
        <div className="flex-1 flex items-center justify-center p-8 min-h-[80vh]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg"
            >
                <AnimatePresence mode="wait">
                    {!claimedLink ? (
                        <motion.div
                            key="claim-form"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card className="border-border/50 shadow-xl overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40 w-full" />

                                <CardHeader className="text-center pt-10 pb-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.15 }}
                                        className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 ring-4 ring-primary/5"
                                    >
                                        <Sparkles className="h-7 w-7 text-primary" />
                                    </motion.div>
                                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome to DareToSend!</CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Claim your unique link to start receiving anonymous feedback.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="pb-10 px-8">
                                    <form onSubmit={handleClaim} className="space-y-5">
                                        {/* Username Input */}
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-foreground">Choose your username</label>
                                            <div className={`flex items-center gap-0 rounded-lg border bg-background overflow-hidden transition-all duration-200 ${inputBorderClass}`}>
                                                <span className="text-sm text-muted-foreground px-3.5 py-3 bg-muted/40 border-r whitespace-nowrap font-mono">
                                                    {typeof window !== "undefined" ? window.location.host : "daretosend.com"}/
                                                </span>
                                                <Input
                                                    placeholder="your_username"
                                                    value={username}
                                                    onChange={handleRawInput}
                                                    className="border-0 focus-visible:ring-0 shadow-none text-base font-mono h-11"
                                                    maxLength={20}
                                                    autoFocus
                                                    autoComplete="off"
                                                    spellCheck={false}
                                                />
                                                {/* Inline status icon */}
                                                <div className="pr-3 flex items-center">
                                                    <AnimatePresence mode="wait">
                                                        {status === "checking" && (
                                                            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                            </motion.div>
                                                        )}
                                                        {status === "available" && (
                                                            <motion.div key="ok" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                                                <Check className="h-4 w-4 text-green-500" />
                                                            </motion.div>
                                                        )}
                                                        {(status === "taken" || status === "invalid" || hasInvalidChars) && (
                                                            <motion.div key="no" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                                                <X className="h-4 w-4 text-destructive" />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Status Message */}
                                            <div className="min-h-[20px] px-0.5">
                                                <AnimatePresence mode="wait">
                                                    <StatusIndicator key={status + username.length} />
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Suggestions */}
                                        <AnimatePresence>
                                            {suggestions.length > 0 && status === "taken" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="rounded-lg border bg-muted/20 p-4 space-y-2.5">
                                                        <p className="text-xs font-medium text-muted-foreground">Try one of these:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {suggestions.map((s) => (
                                                                <button
                                                                    key={s}
                                                                    type="button"
                                                                    onClick={() => selectSuggestion(s)}
                                                                    className="px-3 py-1.5 text-sm font-mono rounded-md border bg-background hover:bg-primary/5 hover:border-primary/30 hover:text-primary transition-all duration-150 cursor-pointer"
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Preview link when available */}
                                        <AnimatePresence>
                                            {status === "available" && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3.5 flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                                            <ArrowRight className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs text-green-700 font-medium">Your profile link will be</p>
                                                            <code className="text-sm font-mono text-green-800 truncate block">
                                                                {typeof window !== "undefined" ? window.location.origin : ""}/{username}
                                                            </code>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Submit error */}
                                        <AnimatePresence>
                                            {submitError && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    className="p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20 flex items-start gap-2"
                                                >
                                                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                                                    {submitError}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Claim Button */}
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full text-base font-semibold h-12 transition-all duration-200"
                                            disabled={!canClaim}
                                        >
                                            {isSubmitting ? (
                                                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Claiming...</>
                                            ) : (
                                                "Claim Your Link"
                                            )}
                                        </Button>

                                        <p className="text-center text-[11px] text-muted-foreground">
                                            You can&apos;t change your username after claiming.
                                        </p>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, type: "spring", stiffness: 150 }}
                        >
                            <Card className="border-border/50 shadow-xl overflow-hidden">
                                <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 w-full" />
                                <CardHeader className="text-center pt-10 pb-4">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                                        className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4 ring-4 ring-green-500/10"
                                    >
                                        <Check className="h-8 w-8 text-green-500" />
                                    </motion.div>
                                    <CardTitle className="text-2xl">You&apos;re all set! 🎉</CardTitle>
                                    <CardDescription className="text-base mt-1">
                                        Share this link with anyone to receive anonymous feedback.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-10 px-8 space-y-6">
                                    <div className="flex items-center gap-2 rounded-lg border bg-muted/20 p-3.5">
                                        <code className="flex-1 text-sm font-mono truncate text-foreground">
                                            {claimedLink}
                                        </code>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCopy}
                                            className="shrink-0"
                                        >
                                            {copied ? (
                                                <><Check className="h-4 w-4 mr-1" /> Copied!</>
                                            ) : (
                                                <><Copy className="h-4 w-4 mr-1" /> Copy</>
                                            )}
                                        </Button>
                                    </div>
                                    <Button
                                        size="lg"
                                        className="w-full text-base h-12"
                                        onClick={() => router.push(returnTo ? decodeURIComponent(returnTo) : "/dashboard")}
                                    >
                                        {returnTo ? "Return to Profile" : "Go to Dashboard"}
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
