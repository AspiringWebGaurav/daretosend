import * as React from "react"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { getSessionUser } from "@/domains/auth/getSessionUser"
import { hasRole } from "@/domains/auth/requireRole"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const user = await getSessionUser()
    if (!user) redirect("/login")
    if (!hasRole(user, "admin")) redirect("/dashboard")

    return <DashboardLayout isAdmin={true}>{children}</DashboardLayout>
}
