import * as React from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { DesktopOnlyWrapper } from "@/components/layout/DesktopOnlyWrapper"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <DesktopOnlyWrapper>
            <DashboardLayout>{children}</DashboardLayout>
        </DesktopOnlyWrapper>
    )
}
