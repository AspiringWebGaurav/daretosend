"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { useRealtimeInbox } from "@/hooks/useRealtimeInbox"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { Copy, Check, Link2, Inbox, BookOpen, Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react"

export default function DashboardOverviewPage() {
    return (
        <ErrorBoundary>
            <DashboardContent />
        </ErrorBoundary>
    )
}

function DashboardContent() {
    const router = useRouter()
    const { user, loading: authLoading } = useAuth()
    const { messages, loading: inboxLoading, error: inboxError } = useRealtimeInbox(user?.uid ?? null)

    const [profile, setProfile] = React.useState<{ displayName?: string, username?: string, claimedLink?: string } | null>(null)
    const [profileLoading, setProfileLoading] = React.useState(true)
    const [profileError, setProfileError] = React.useState<string | null>(null)
    const [copied, setCopied] = React.useState(false)

    const fetchProfile = React.useCallback(async () => {
        setProfileLoading(true)
        setProfileError(null)
        try {
            const res = await fetch("/api/users/me")
            if (res.ok) {
                const data = await res.json()
                setProfile(data.data)
            } else {
                console.error("[DTS] Profile fetch failed:", res.status)
                setProfileError("Failed to load profile.")
            }
        } catch (err) {
            console.error("[DTS] Profile fetch error:", err)
            setProfileError("Failed to load profile. Please check your connection.")
        } finally {
            setProfileLoading(false)
        }
    }, [])

    React.useEffect(() => {
        if (user) fetchProfile()
        else if (!authLoading) setProfileLoading(false)
    }, [user, authLoading, fetchProfile])

    // Use the absolute claimedLink if available, otherwise just use username if it has one (legacy fallback)
    const profileLink = profile?.claimedLink || (profile?.username
        ? `${typeof window !== "undefined" ? window.location.origin : ""}/${profile.username}`
        : null)

    const handleCopy = async () => {
        if (!profileLink) return
        await navigator.clipboard.writeText(profileLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (authLoading || profileLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (profileError || inboxError) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground">{profileError || inboxError}</p>
                    </div>
                    <Button onClick={() => { setProfileError(null); fetchProfile(); }} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Welcome{profile?.displayName ? `, ${profile.displayName}` : ""}. Here&apos;s your overview.
                </p>
            </div>

            {/* Your Link or Claim Link */}
            {profile?.username ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Link2 className="h-5 w-5 text-primary" />
                                    Your Link
                                </CardTitle>
                                <CardDescription>Share this link to receive anonymous feedback</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-3">
                                <code className="flex-1 text-sm font-mono truncate text-foreground">
                                    {profileLink}
                                </code>
                                <Button variant="ghost" size="sm" onClick={handleCopy} className="shrink-0">
                                    {copied ? (
                                        <><Check className="h-4 w-4 mr-1" /> Copied!</>
                                    ) : (
                                        <><Copy className="h-4 w-4 mr-1" /> Copy</>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-primary/30 bg-primary/5">
                        <CardHeader className="text-center pt-8">
                            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle className="text-xl">Claim Your Link</CardTitle>
                            <CardDescription>
                                Get a unique profile link so people can send you anonymous feedback.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pb-8">
                            <Button size="lg" onClick={() => router.push("/dashboard/onboarding")}>
                                Claim Your Link
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Inbox Messages</CardTitle>
                            <Inbox className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {inboxLoading ? "..." : messages.length}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Approved messages in your inbox</p>
                            <Button variant="ghost" size="sm" className="mt-2 -ml-2" onClick={() => router.push("/dashboard/inbox")}>
                                View Inbox →
                            </Button>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="hover:border-primary/50 transition-colors">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Guide</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-start gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">1</Badge>
                                    Share your link with friends, colleagues, or on social media
                                </li>
                                <li className="flex items-start gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">2</Badge>
                                    Receive anonymous feedback in your inbox
                                </li>
                                <li className="flex items-start gap-2">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">3</Badge>
                                    Reply to messages — senders stay anonymous unless they choose otherwise
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
