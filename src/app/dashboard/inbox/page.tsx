"use client"
import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Loader2, MessageSquare, Reply, Trash2, Circle, Mail, MailOpen, AlertCircle, RefreshCw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/hooks/useAuth"
import { useRealtimeInbox } from "@/hooks/useRealtimeInbox"
import { useUnreadCount } from "@/hooks/useUnreadCount"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"

export interface InboxMessage {
    id: string;
    content: string;
    senderId: string;
    receiverId: string;
    identityMode: string;
    displayName: string | null;
    status: string;
    readAt: { _seconds?: number; toDate?: () => Date } | string | null;
    createdAt: { _seconds?: number; toDate?: () => Date } | string | null;
    approvedAt: { _seconds?: number; toDate?: () => Date } | string | null;
    thread?: {
        receiverReply?: string;
        senderReply?: string;
    };
}

export default function InboxPage() {
    return (
        <ErrorBoundary>
            <InboxContent />
        </ErrorBoundary>
    )
}

function InboxContent() {
    const { user, loading: authLoading } = useAuth()
    const { messages, loading, error: inboxError } = useRealtimeInbox(user?.uid ?? null)
    const { unreadCount, optimisticDecrement, optimisticIncrement } = useUnreadCount(user?.uid ?? null)
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [replyText, setReplyText] = React.useState("")
    const [isReplying, setIsReplying] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [isComposing, setIsComposing] = React.useState(false)
    const [replySuccess, setReplySuccess] = React.useState<string | null>(null)
    const [actionError, setActionError] = React.useState<string | null>(null)

    const selectedMsg = (messages as InboxMessage[]).find((m) => m.id === selectedId)

    // If the selected message was deleted (realtime), clear selection
    React.useEffect(() => {
        if (selectedId && !(messages as InboxMessage[]).find((m) => m.id === selectedId)) {
            setSelectedId(null)
        }
    }, [messages, selectedId])

    const filteredMessages = (messages as InboxMessage[]).filter((msg) =>
        msg.content?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSelect = async (msgId: string) => {
        setSelectedId(msgId)
        setIsComposing(false)
        setReplySuccess(null)
        const msg = (messages as InboxMessage[]).find((m) => m.id === msgId)
        if (msg && !msg.readAt) {
            // Optimistic: instantly update bell dot
            optimisticDecrement()
            try {
                // Auto-mark read on select
                await fetch(`/api/messages/${msgId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "mark_read" })
                })
            } catch {
                // Revert optimistic on failure
                optimisticIncrement()
            }
        }
    }

    const handleToggleRead = async (msgId: string, isCurrentlyRead: boolean) => {
        // Optimistic: instantly update bell dot
        if (isCurrentlyRead) {
            optimisticIncrement()
        } else {
            optimisticDecrement()
        }
        try {
            await fetch(`/api/messages/${msgId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: isCurrentlyRead ? "mark_unread" : "mark_read" })
            })
        } catch {
            // Revert optimistic on failure
            if (isCurrentlyRead) {
                optimisticDecrement()
            } else {
                optimisticIncrement()
            }
        }
    }

    const handleReply = async () => {
        if (!selectedId || !replyText.trim()) return
        setIsReplying(true)
        setActionError(null)
        try {
            const res = await fetch(`/api/messages/${selectedId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: replyText.trim() }),
            })
            if (res.ok) {
                setReplySuccess(selectedId)
                setReplyText("")
            } else {
                console.error("[DTS] Reply failed:", res.status)
                setActionError("Failed to send reply. Please try again.")
            }
        } catch (err) {
            console.error("[DTS] Reply error:", err)
            setActionError("Failed to send reply. Please check your connection.")
        } finally {
            setIsReplying(false)
        }
    }

    const handleDelete = async (msgId: string) => {
        setIsDeleting(true)
        setActionError(null)
        // If the message being deleted is unread, optimistically decrement
        const msg = (messages as InboxMessage[]).find((m) => m.id === msgId)
        const wasUnread = msg && !msg.readAt
        if (wasUnread) optimisticDecrement()
        try {
            const res = await fetch(`/api/messages/${msgId}`, { method: "DELETE" })
            if (res.ok) {
                if (selectedId === msgId) setSelectedId(null)
            } else {
                console.error("[DTS] Delete failed:", res.status)
                setActionError("Failed to delete message. Please try again.")
                if (wasUnread) optimisticIncrement() // revert
            }
        } catch (err) {
            console.error("[DTS] Delete error:", err)
            setActionError("Failed to delete message. Please check your connection.")
            if (wasUnread) optimisticIncrement() // revert
        } finally {
            setIsDeleting(false)
        }
    }

    const formatDate = (timestamp: { toDate?: () => Date, _seconds?: number } | string | null | undefined) => {
        if (!timestamp) return ""
        const date = typeof timestamp === 'object' && timestamp.toDate
            ? timestamp.toDate()
            : typeof timestamp === 'object' && timestamp._seconds
                ? new Date(timestamp._seconds * 1000)
                : new Date(timestamp as string)
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        })
    }

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (inboxError) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                    <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertCircle className="h-7 w-7 text-destructive" />
                    </div>
                    <div className="space-y-1.5">
                        <h3 className="text-lg font-semibold">Something went wrong</h3>
                        <p className="text-sm text-muted-foreground">{inboxError}</p>
                    </div>
                    <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Retry
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Inline action error banner */}
            <AnimatePresence>
                {actionError && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20 flex items-center gap-2"
                    >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {actionError}
                        <button onClick={() => setActionError(null)} className="ml-2 text-destructive/60 hover:text-destructive">&times;</button>
                    </motion.div>
                )}
            </AnimatePresence>
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h1 className="text-2xl font-bold tracking-tight">Inbox</h1>
                    <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs rounded-full px-2">
                                {unreadCount} new
                            </Badge>
                        )}
                        <Badge variant="secondary" className="rounded-full px-2 bg-muted">{messages.length} Messages</Badge>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search messages..."
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                    {filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {messages.length === 0 ? "No messages yet" : "No matching messages"}
                            </p>
                            {messages.length === 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    Share your link to start receiving feedback
                                </p>
                            )}
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {filteredMessages.map((msg) => {
                                const isUnread = !msg.readAt
                                const isSelected = selectedId === msg.id
                                return (
                                    <motion.div
                                        key={msg.id}
                                        initial={{ opacity: 0, scale: 0.98, y: -10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => handleSelect(msg.id)}
                                        className={`p-4 mb-6 rounded-xl border cursor-pointer transition-all group relative overflow-visible ${isSelected
                                            ? 'bg-primary/5 border-primary/20 shadow-sm'
                                            : isUnread
                                                ? 'bg-card hover:bg-card border-border shadow-sm'
                                                : 'bg-transparent hover:bg-muted/30 border-transparent hover:border-border/50'
                                            }`}
                                    >
                                        {/* Active indicator line */}
                                        {isSelected && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}

                                        <div className="flex justify-between items-start mb-2 relative z-10">
                                            <div className="flex items-center gap-2">
                                                {isUnread && (
                                                    <Circle className="h-2 w-2 fill-primary text-primary shrink-0" />
                                                )}
                                                <span className={`text-sm ${isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                                                    {msg.identityMode === 'anonymous' ? 'Anonymous' : msg.displayName || 'Named Account'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Hover actions */}
                                                <div className="flex flex-row gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleToggleRead(msg.id, !isUnread); }}
                                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                        title={isUnread ? "Mark as read" : "Mark as unread"}
                                                    >
                                                        {isUnread ? <MailOpen className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleDelete(msg.id); }}
                                                        className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        title="Delete message"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <span className={`text-[11px] whitespace-nowrap ${isUnread ? 'text-primary/80 font-medium' : 'text-muted-foreground'}`}>{formatDate(msg.approvedAt || msg.createdAt)}</span>
                                            </div>
                                        </div>
                                        <p className={`text-sm line-clamp-2 pr-2 relative z-10 leading-relaxed ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                                            {msg.content}
                                        </p>
                                    </motion.div>
                                )
                            })}
                        </AnimatePresence>
                    )}
                </div>
            </div>

            <Card className="hidden md:flex flex-1 flex-col overflow-hidden bg-background rounded-2xl shadow-sm border border-border/60">
                <AnimatePresence mode="wait">
                    {selectedMsg ? (
                        <motion.div
                            key={selectedMsg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="flex flex-col h-full"
                        >
                            <CardHeader className="border-b bg-muted/10 px-8 py-6">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <CardTitle className="text-xl tracking-tight flex items-center gap-2">
                                            {selectedMsg.identityMode === 'anonymous' ? 'Anonymous Sender' : `Message from ${selectedMsg.displayName || 'Named User'}`}
                                            {selectedMsg.identityMode === 'anonymous' && (
                                                <Badge variant="outline" className="ml-2 font-normal rounded-full px-2.5 text-xs bg-muted/40">Incognito</Badge>
                                            )}
                                        </CardTitle>
                                        <p className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                            <span>Received • {formatDate(selectedMsg.approvedAt || selectedMsg.createdAt)}</span>
                                            {!selectedMsg.readAt ? (
                                                <span className="flex items-center gap-1 text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full"><Circle className="h-2 w-2 fill-primary" /> Unread</span>
                                            ) : (
                                                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">Read</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg border border-border/50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleToggleRead(selectedMsg.id, !!selectedMsg.readAt)}
                                            className="text-muted-foreground h-8"
                                            title={!selectedMsg.readAt ? "Mark Read" : "Mark Unread"}
                                        >
                                            {!selectedMsg.readAt ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(selectedMsg.id)}
                                            disabled={isDeleting}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8"
                                            title="Delete message"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto px-8 py-8 bg-card">
                                <div className="max-w-prose space-y-8">
                                    <p className="text-[17px] leading-relaxed text-foreground whitespace-pre-wrap">{selectedMsg.content}</p>

                                    {/* Thread replies */}
                                    {selectedMsg.thread?.receiverReply && (
                                        <div className="border-l-4 border-primary/40 pl-5 space-y-1.5 py-1">
                                            <p className="text-[13px] tracking-wide uppercase text-primary font-bold">Your reply</p>
                                            <p className="text-[15px] leading-relaxed text-foreground/90">{selectedMsg.thread.receiverReply}</p>
                                        </div>
                                    )}

                                    {selectedMsg.thread?.senderReply && (
                                        <div className="border-l-4 border-muted-foreground/30 pl-5 space-y-1.5 py-1">
                                            <p className="text-[13px] tracking-wide uppercase text-muted-foreground font-bold">Their response</p>
                                            <p className="text-[15px] leading-relaxed text-muted-foreground">{selectedMsg.thread.senderReply}</p>
                                        </div>
                                    )}

                                    {/* Reply form */}
                                    {!selectedMsg.thread?.receiverReply && replySuccess !== selectedMsg.id && (
                                        <div className="pt-6 border-t border-border/40 mt-8">
                                            <AnimatePresence initial={false} mode="wait">
                                                {!isComposing ? (
                                                    <motion.div
                                                        key="reply-button"
                                                        initial={{ opacity: 0, y: -5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: -5 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => setIsComposing(true)}
                                                            className="w-full sm:w-auto text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Reply className="h-4 w-4 mr-2" />
                                                            Reply to Message
                                                        </Button>
                                                    </motion.div>
                                                ) : (
                                                    <motion.div
                                                        key="composer"
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="space-y-4 overflow-hidden origin-top"
                                                    >
                                                        <Textarea
                                                            placeholder="Write your reply..."
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            className="min-h-[120px] resize-none focus-visible:ring-1 focus-visible:ring-primary/50 bg-background border-border/70 rounded-xl px-4 py-3"
                                                            autoFocus
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={handleReply}
                                                                disabled={!replyText.trim() || isReplying}
                                                                className="flex-1 sm:flex-none"
                                                            >
                                                                {isReplying ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                                ) : (
                                                                    <Reply className="h-4 w-4 mr-1" />
                                                                )}
                                                                Send Reply
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setIsComposing(false)
                                                                    setReplyText("")
                                                                }}
                                                                disabled={isReplying}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                    {replySuccess === selectedMsg.id && (
                                        <div className="pt-6 border-t border-border/40 mt-8">
                                            <div className="inline-flex items-center text-sm text-green-600 bg-green-600/10 px-3 py-1.5 rounded-full font-medium">
                                                <Circle className="h-2 w-2 fill-green-600 mr-2" />
                                                Reply sent successfully
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="empty-state"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col items-center justify-center space-y-6 p-8 bg-card"
                        >
                            <div className="h-24 w-24 rounded-3xl bg-muted/40 flex items-center justify-center border border-dashed border-border shadow-sm">
                                <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
                            </div>
                            <div className="text-center space-y-1.5">
                                <h3 className="text-xl font-semibold tracking-tight text-foreground">No conversation selected</h3>
                                <p className="text-sm text-muted-foreground">Select a message from the list to view the conversation.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>
        </div>
    )
}
