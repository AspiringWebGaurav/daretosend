"use client"
import * as React from "react"
import { motion } from "framer-motion"
import { Users, AlertTriangle, ShieldCheck, Mail, Loader2 } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Stats {
    totalUsers: number
    totalMessages: number
    pendingModeration: number
    bannedUsers: number
}

interface UserItem {
    id: string
    email: string
    displayName: string
    username: string | null
    status: string
    role: string
    createdAt: { _seconds?: number } | string | null
}

export default function AdminOverview() {
    const [stats, setStats] = React.useState<Stats | null>(null)
    const [users, setUsers] = React.useState<UserItem[]>([])
    const [loading, setLoading] = React.useState(true)

    React.useEffect(() => {
        async function fetchData() {
            try {
                const [statsRes, usersRes] = await Promise.all([
                    fetch("/api/admin/stats"),
                    fetch("/api/admin/users/list"),
                ])
                if (statsRes.ok) {
                    const s = await statsRes.json()
                    setStats(s.data)
                }
                if (usersRes.ok) {
                    const u = await usersRes.json()
                    setUsers((u.data || []).slice(0, 5))
                }
            } catch {
                // silent
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const statCards = [
        { title: "Total Users", value: stats?.totalUsers ?? 0, icon: Users },
        { title: "Total Messages", value: stats?.totalMessages ?? 0, icon: Mail },
        { title: "Moderation Queue", value: stats?.pendingModeration ?? 0, icon: AlertTriangle, alert: (stats?.pendingModeration ?? 0) > 0 },
        { title: "Banned Users", value: stats?.bannedUsers ?? 0, icon: ShieldCheck },
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Analytics Overview</h1>
                <p className="text-muted-foreground mt-2">Monitor platform metrics, user growth, and moderation queues.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Card className="hover:border-primary/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.alert ? 'text-destructive' : 'text-muted-foreground'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Users</CardTitle>
                    <CardDescription>Latest signups and their current system status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{user.displayName}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={user.status === 'active' ? 'secondary' : 'destructive'} className="capitalize">
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-muted-foreground">{user.role}</TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
