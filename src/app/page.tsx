"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { MessageSquare, Link2, Shield, LogOut } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { signOut, type User } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { useLoading } from "@/context/LoadingContext"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"

interface UserDropdownProps {
  user: User
  router: { push: (href: string) => void }
}

function UserDropdown({ user, router }: UserDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const { setLoading } = useLoading()

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" }).catch(() => { })
      await signOut(auth)
      if (typeof window !== "undefined") {
        localStorage.removeItem("dts_session")
        localStorage.removeItem("dts_session_start")
      }
    } catch { }
  }

  const menuItems = (
    <button
      tabIndex={-1}
      onClick={handleLogout}
      className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-500/10 transition-colors"
    >
      <LogOut className="h-3.5 w-3.5 shrink-0" />
      Logout
    </button>
  )

  return (
    <div className="relative inline-flex flex-col" ref={dropdownRef}>
      {/* Shadow — in-flow, invisible, sizes wrapper to match dropdown content */}
      <div className="h-0 overflow-hidden pointer-events-none invisible p-1" aria-hidden="true">
        {menuItems}
      </div>

      {/* Trigger — fills wrapper width */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full inline-flex items-center gap-2 py-1 pl-1.5 pr-3 rounded-full transition-colors border border-border/50 bg-background shadow-sm hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {user.photoURL ? (
          <Image
            src={user.photoURL}
            alt=""
            width={28}
            height={28}
            className="rounded-full ring-1 ring-border shrink-0 block"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
            {user.displayName?.charAt(0).toUpperCase() ?? "U"}
          </div>
        )}
        <span className="text-sm font-semibold leading-none whitespace-nowrap">{user.displayName?.split(" ")[0] ?? "User"}</span>
      </button>

      {/* Dropdown — at least as wide as trigger, right-anchored */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 6 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className="absolute right-0 top-full mt-2 min-w-full w-max rounded-xl border border-border/50 bg-card p-1 shadow-md z-50"
          >
            {menuItems}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function LandingPage() {
  return (
    <ErrorBoundary>
      <LandingContent />
    </ErrorBoundary>
  )
}

function LandingContent() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const steps = [
    {
      icon: Link2,
      title: "Claim Your Link",
      description: "Sign up and get a unique profile link you can share anywhere.",
    },
    {
      icon: MessageSquare,
      title: "Receive Feedback",
      description: "Anyone with your link can send you anonymous, honest feedback.",
    },
    {
      icon: Shield,
      title: "Moderated & Safe",
      description: "Every message goes through a moderation pipeline before it reaches you.",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      <header className="flex h-16 items-center justify-between px-6 lg:px-12 border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
          <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs">D</div>
          DareToSend
        </div>
        <nav className="flex items-center gap-4 text-sm font-medium">
          {loading ? (
            <div className="w-32 h-9 animate-pulse bg-muted rounded-full"></div>
          ) : user ? (
            <UserDropdown user={user} router={router} />
          ) : (
            <>
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Button size="sm" onClick={() => router.push("/login?reason=claim")}>
                Get Your Link
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-3xl space-y-8"
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight">
            Dare someone to send you the truth.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed">
            The professional, moderation-first anonymous feedback platform. Built for individuals and teams who value radical candor over startup fluff.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {loading ? (
              <div className="w-40 h-12 animate-pulse bg-muted rounded-md shrink-0"></div>
            ) : user ? (
              <Button size="lg" className="w-full sm:w-auto text-base" onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button size="lg" className="w-full sm:w-auto text-base" onClick={() => router.push("/login?reason=claim")}>
                Get Your Link
              </Button>
            )}
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          className="mt-24 w-full max-w-4xl"
        >
          <h2 className="text-2xl font-bold mb-12 text-foreground">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.15 }}
                className="rounded-2xl border bg-card text-card-foreground p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-border/40 py-6 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} DareToSend</span>
          <div className="flex gap-6">
            <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/legal/acceptable-use" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Acceptable Use</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
