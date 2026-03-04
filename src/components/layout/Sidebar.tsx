"use client"
import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { LayoutDashboard, Inbox, Send, Settings, Users, ShieldAlert, LogOut, Loader2, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"
import { useRealtimeInbox } from "@/hooks/useRealtimeInbox"
import { auth } from "@/lib/firebase/client"
import { signOut } from "firebase/auth"

interface SidebarItem {
    name: string
    href: string
    icon: React.ElementType
}

const userNav: SidebarItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Inbox", href: "/dashboard/inbox", icon: Inbox },
    { name: "Sent", href: "/dashboard/sent", icon: Send },
]

const adminNav: SidebarItem[] = [
    { name: "Overview", href: "/admin", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Moderation", href: "/admin/moderation", icon: ShieldAlert },
    { name: "Settings", href: "/admin/config", icon: Settings },
]

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, role, loading } = useAuth()
    const { unreadCount } = useRealtimeInbox(user?.uid ?? null)
    const [isLoggingOut, setIsLoggingOut] = React.useState(false)
    const navigation = isAdmin ? adminNav : userNav

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await fetch("/api/auth/session", { method: "DELETE" })
            await signOut(auth)
            if (typeof window !== "undefined") {
                localStorage.removeItem("dts_session")
                localStorage.removeItem("dts_session_start")
            }
            router.push("/")
        } catch {
            setIsLoggingOut(false)
        }
    }

    const displayName = user?.displayName || "User"
    const email = user?.email || ""
    const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()

    return (
        <div className="hidden lg:flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all">
            <div className="flex h-16 items-center px-6 mb-2">
                <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight text-lg hover:opacity-80 transition-opacity">
                    <div className="h-7 w-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-sm shadow-sm ring-1 ring-primary/20">D</div>
                    DareToSend
                </Link>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="grid gap-1 px-3">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "/dashboard" && item.href !== "/admin")
                        return (
                            <Link
                                key={item.name + item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-medium transition-all relative",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-pill"
                                        className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r-md"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon className="h-4 w-4" />
                                {item.name}
                                {item.name === "Inbox" && !isAdmin && unreadCount > 0 && (
                                    <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Admin link for admin users in user dashboard */}
                {!isAdmin && (role === "admin" || role === "super_admin") && (
                    <div className="px-3 mt-4 pt-4 border-t border-sidebar-border">
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-colors"
                        >
                            <Shield className="h-4 w-4" />
                            Admin Panel
                        </Link>
                    </div>
                )}
            </div>
            <div className="p-4 border-t border-sidebar-border space-y-2">
                {loading ? (
                    <div className="flex items-center justify-center p-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="flex items-center justify-between rounded-xl p-2 hover:bg-muted/50 transition-colors group/profile cursor-default">
                        <div className="flex items-center gap-3 min-w-0">
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full ring-1 ring-border shadow-sm shrink-0" />
                            ) : (
                                <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                                    {initials}
                                </div>
                            )}
                            <div className="flex flex-col min-w-0 pr-2">
                                <span className="text-sm font-semibold leading-none text-foreground truncate">{displayName}</span>
                                <span className="text-[11px] text-muted-foreground mt-1 truncate">{email}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            title="Logout"
                            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover/profile:opacity-100 focus-visible:opacity-100 shrink-0"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
