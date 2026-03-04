"use client"
import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="flex h-16 items-center justify-between px-6 lg:px-12 border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-lg">
          <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">D</div>
          DareToSend
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
            Login
          </Link>
          <Button size="sm" onClick={() => router.push("/login?reason=claim")}>
            Get Your Link
          </Button>
        </nav>
      </header>

      <main className="flex-1 w-full mx-auto max-w-4xl px-6 py-12 md:py-16 lg:px-8">
        <div className="prose prose-slate dark:prose-invert prose-headings:font-semibold prose-a:text-primary hover:prose-a:underline max-w-none">
          {children}
        </div>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 lg:px-12 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} DareToSend</span>
          <div className="flex gap-6">
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/legal/acceptable-use" className="hover:text-foreground transition-colors">Acceptable Use</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
