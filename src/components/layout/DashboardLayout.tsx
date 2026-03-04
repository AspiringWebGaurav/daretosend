import * as React from "react"
import { Sidebar } from "./Sidebar"
import { GlobalLoader } from "./GlobalLoader"
import { Bell, Search } from "lucide-react"

export function DashboardLayout({ children, isAdmin = false }: { children: React.ReactNode, isAdmin?: boolean }) {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary selection:text-primary-foreground">
            <Sidebar isAdmin={isAdmin} />
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 w-full items-center justify-between border-b px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground w-full max-w-sm">
                        <Search className="h-4 w-4" />
                        <span className="hidden lg:inline-flex">Search or type a command...</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-accent">
                            <Bell className="h-4 w-4" />
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                        </button>
                    </div>
                </header>
                <main className="relative flex-1 overflow-y-auto p-8">
                    <GlobalLoader />
                    <div className="mx-auto max-w-5xl">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
