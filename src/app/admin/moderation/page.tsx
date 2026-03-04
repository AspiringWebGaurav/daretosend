"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, ShieldAlert } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface QueueItem {
    id: string
    messageId: string
    content: string
    senderId: string
    receiverId: string
    identityMode: string
    displayName: string | null
    status: string
    queuedAt: { _seconds?: number } | string | null
}

export default function AdminModerationPage() {
    const [items, setItems] = React.useState<QueueItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    const fetchQueue = async () => {
        try {
            const res = await fetch("/api/moderation/queue")
            if (res.ok) {
                const data = await res.json()
                setItems(data.data || [])
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { fetchQueue() }, [])

    const handleAction = async (messageId: string, action: "approve" | "reject") => {
        setActionLoading(messageId)
        try {
            await fetch(`/api/moderation/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId }),
            })
            setItems(prev => prev.filter(i => i.messageId !== messageId))
        } catch {
            // silent
        } finally {
            setActionLoading(null)
        }
    }

    const formatDate = (timestamp: { _seconds?: number } | string | null) => {
        if (!timestamp) return ""
        if (typeof timestamp === 'object' && timestamp !== null && '_seconds' in timestamp && timestamp._seconds) {
            return new Date(timestamp._seconds * 1000).toLocaleDateString("en-US", {
                month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })
        }
        return ""
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Moderation Queue</h1>
                    <p className="text-muted-foreground mt-2">Review and approve or reject pending messages.</p>
                </div>
                <Badge variant="secondary" className="text-sm">
                    {items.length} pending
                </Badge>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                        <h2 className="text-lg font-semibold mb-1">All clear!</h2>
                        <p className="text-sm text-muted-foreground">No messages pending review.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {items.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Card className="hover:border-primary/30 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                            <CardTitle className="text-base">
                                                {item.identityMode === "anonymous" ? "Anonymous" : item.displayName || "Named User"}
                                            </CardTitle>
                                            <Badge variant="outline" className="text-[10px] capitalize">{item.identityMode}</Badge>
                                        </div>
                                        <span className="text-xs text-muted-foreground">{formatDate(item.queuedAt)}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 rounded-lg bg-muted/30 border">
                                        <p className="text-sm whitespace-pre-wrap">{item.content}</p>
                                    </div>
                                    <div className="flex items-center justify-end gap-2">
                                        {actionLoading === item.messageId ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleAction(item.messageId, "reject")}
                                                >
                                                    <XCircle className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleAction(item.messageId, "approve")}
                                                >
                                                    <CheckCircle2 className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
