"use client"
import * as React from "react"
import { MoreHorizontal, ShieldOff, CheckCircle2, Loader2 } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface UserItem {
    id: string
    uid: string
    username: string | null
    email: string
    displayName: string
    status: string
    role: string
    shadowBanned: boolean
}

export default function AdminUsersPage() {
    const [users, setUsers] = React.useState<UserItem[]>([])
    const [loading, setLoading] = React.useState(true)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users/list")
            if (res.ok) {
                const data = await res.json()
                setUsers(data.data || [])
            }
        } catch {
            // silent
        } finally {
            setLoading(false)
        }
    }

    React.useEffect(() => { fetchUsers() }, [])

    const handleAction = async (action: string, targetUid: string) => {
        setActionLoading(targetUid)
        try {
            await fetch(`/api/admin/users/${action}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUid }),
            })
            await fetchUsers()
        } catch {
            // silent
        } finally {
            setActionLoading(null)
        }
    }

    const filteredUsers = users.filter(u =>
        (u.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                <p className="text-muted-foreground mt-2">View and manage platform users and their moderation status.</p>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle>All Users</CardTitle>
                        <CardDescription>A list of all users registered on your instance.</CardDescription>
                    </div>
                    <div className="w-full max-w-sm">
                        <Input
                            placeholder="Search by username or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{user.username ? `@${user.username}` : user.displayName}</span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={user.status === 'active' ? 'secondary' : 'destructive'}
                                                className="capitalize"
                                            >
                                                {user.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-muted-foreground">{user.role}</TableCell>
                                        <TableCell className="text-right">
                                            {actionLoading === user.uid ? (
                                                <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        {user.status !== 'active' && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-green-600 focus:text-green-600"
                                                                onClick={() => handleAction("unban", user.uid)}
                                                            >
                                                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                                                Restore Account
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.status === 'active' && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                                onClick={() => handleAction("suspend", user.uid)}
                                                            >
                                                                <ShieldOff className="mr-2 h-4 w-4" />
                                                                Suspend Account
                                                            </DropdownMenuItem>
                                                        )}
                                                        {user.status !== 'banned' && (
                                                            <DropdownMenuItem
                                                                className="cursor-pointer text-destructive focus:text-destructive"
                                                                onClick={() => handleAction("ban", user.uid)}
                                                            >
                                                                <ShieldOff className="mr-2 h-4 w-4" />
                                                                Ban Account
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {filteredUsers.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
