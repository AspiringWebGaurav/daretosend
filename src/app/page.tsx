"use client"
import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Shield, LogOut, ChevronDown, Copy, Check, Instagram, Twitter, Linkedin, MessageCircle, Share2, ArrowRight } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { signOut, type User } from "firebase/auth"
import { auth } from "@/lib/firebase/client"
import { useLoading } from "@/context/LoadingContext"
import { ErrorBoundary } from "@/components/layout/ErrorBoundary"
import { ScrollNavButton } from "@/components/ui/ScrollNavButton"
import { ShareAnywhereAnimation } from "@/components/ui/ShareAnywhereAnimation"

interface UserDropdownProps {
  user: User
}

function UserDropdown({ user }: UserDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
            className="absolute right-0 top-full mt-2 min-w-full w-max rounded-xl border border-border/50 bg-card p-1 shadow-md z-50 focus:outline-none"
          >
            {menuItems}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function MockPreview() {
  const message = "Your explanations make complex topics easy.";
  const [displayedText, setDisplayedText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [showSkeleton, setShowSkeleton] = React.useState(true);

  React.useEffect(() => {
    // Vercel-style perceived speed: show skeleton briefly
    const skeletonTimer = setTimeout(() => setShowSkeleton(false), 800);
    return () => clearTimeout(skeletonTimer);
  }, []);

  React.useEffect(() => {
    if (showSkeleton) return;

    let i = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const typeAnimation = () => {
      const currentText = isDeleting
        ? message.substring(0, i - 1)
        : message.substring(0, i + 1);

      setDisplayedText(currentText);

      if (!isDeleting && i === message.length) {
        // Finished typing, "click" send
        setIsSending(true);
        timer = setTimeout(() => {
          setIsSending(false);
          isDeleting = true;
          // Fast delete
          timer = setTimeout(typeAnimation, 800);
        }, 1500);
        return;
      }

      if (isDeleting && i === 0) {
        isDeleting = false;
        // Pause before typing again
        timer = setTimeout(typeAnimation, 1000);
        return;
      }

      i = isDeleting ? i - 1 : i + 1;
      // Randomize typing speed slightly for realism
      const typingSpeed = isDeleting ? 30 : 60 + Math.random() * 40;
      timer = setTimeout(typeAnimation, typingSpeed);
    };

    timer = setTimeout(typeAnimation, 500);

    return () => clearTimeout(timer);
  }, [showSkeleton]);

  return (
    <div className="relative w-full max-w-md mx-auto pointer-events-none select-none">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative bg-white/80 backdrop-blur-xl border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/[0.04] transition-all duration-500"
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center ring-4 ring-white shadow-sm overflow-hidden relative">
            {showSkeleton && <div className="absolute inset-0 bg-indigo-200/50 animate-pulse" />}
            {!showSkeleton && <span className="text-2xl font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">G</span>}
          </div>

          <div className="space-y-2 w-full">
            {showSkeleton ? (
              <div className="space-y-2 flex flex-col items-center">
                <div className="h-6 w-3/4 bg-neutral-200/60 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-neutral-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight">Send anonymous feedback to Gaurav</h3>
                <p className="text-sm text-neutral-500">They won&apos;t know it&apos;s from you.</p>
              </>
            )}
          </div>

          <div className="w-full space-y-3">
            <div className={`w-full bg-neutral-50 border transition-all duration-300 rounded-2xl p-4 text-left shadow-inner flex flex-col h-[120px] ${displayedText.length > 0 ? 'border-indigo-500/30 ring-2 ring-indigo-500/10' : 'border-neutral-200/60'}`}>
              {showSkeleton ? (
                <div className="space-y-2 mt-2">
                  <div className="h-4 w-full bg-neutral-200/60 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-neutral-200/60 rounded animate-pulse" />
                </div>
              ) : (
                <span className={`font-medium font-sans ${displayedText.length === 0 ? 'text-neutral-400' : 'text-neutral-900'}`}>
                  {displayedText.length === 0 ? "Type your message here..." : displayedText}
                  <span className="inline-block w-[2px] h-4 bg-indigo-500 ml-0.5 animate-pulse align-middle" />
                </span>
              )}
            </div>

            <div className={`w-full h-[48px] rounded-xl font-semibold text-sm shadow-md flex items-center justify-center gap-2 transition-all duration-300 ${isSending ? 'bg-indigo-600 text-white scale-[0.98]' : showSkeleton ? 'bg-neutral-200 text-transparent animate-pulse shadow-none' : 'bg-neutral-900 text-white'}`}>
              {!showSkeleton && <Shield className={`w-4 h-4 ${isSending ? 'text-indigo-200' : 'text-neutral-400'}`} />}
              {!showSkeleton && 'Send anonymously'}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ExampleMessages() {
  const messages = [
    "You're great at explaining complex concepts simply.",
    "I admire your consistency and work ethic.",
    "You should start teaching more, you have a knack for it.",
    "Your recent presentation was truly inspiring.",
    "I appreciate how you always help the team."
  ];

  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="h-32 flex items-center justify-center overflow-hidden px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "anticipate" }}
          className="text-lg sm:text-2xl md:text-3xl font-medium text-neutral-800 tracking-tight text-center max-w-2xl"
        >
          &ldquo;{messages[currentIndex]}&rdquo;
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Claim your link",
      desc: "Get your unique username. It takes less than 10 seconds."
    },
    {
      num: "02",
      title: "Share it anywhere",
      desc: "Post it on your Instagram, Twitter, or send it directly."
    },
    {
      num: "03",
      title: "Receive the truth",
      desc: "Read honest, moderated feedback in your private dashboard."
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 max-w-5xl md:mx-auto text-left">
      {steps.map((step, i) => (
        <motion.div
          key={step.num}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: i * 0.15, ease: "easeOut" }}
          className="relative"
        >
          <div className="text-5xl font-extrabold text-neutral-100 mb-4 select-none tracking-tighter">
            {step.num}
          </div>
          <h3 className="text-xl font-bold text-neutral-900 mb-2">{step.title}</h3>
          <p className="text-neutral-500 leading-relaxed font-medium">
            {step.desc}
          </p>
        </motion.div>
      ))}
    </div>
  )
}

function ViralShareSection() {
  const [copied, setCopied] = React.useState(false);
  const router = useRouter();

  const copyLink = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="max-w-2xl mx-auto bg-neutral-900 rounded-3xl p-8 sm:p-12 text-center shadow-2xl overflow-hidden relative"
    >
      {/* Decorative background blur */}
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold text-white tracking-tight">Ready to hear the truth?</h2>
          <p className="text-neutral-400 font-medium">Create your link and start receiving real feedback today.</p>
        </div>

        <div className="flex items-center justify-center p-1 bg-neutral-800/80 rounded-2xl max-w-sm mx-auto border border-neutral-700/50 backdrop-blur-sm shadow-inner group transition-all hover:bg-neutral-800">
          <div className="flex-1 px-4 py-3 text-left font-mono text-sm sm:text-base text-neutral-300 truncate select-none">
            daretosend.eu.cc/<span className="text-white font-semibold">username</span>
          </div>
          <button
            onClick={copyLink}
            className="flex items-center justify-center w-10 h-10 bg-white rounded-xl text-black hover:bg-neutral-100 transition-colors shrink-0 m-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex justify-center pt-2 pb-2">
          <Button
            size="lg"
            className="rounded-full px-10 h-16 text-lg font-bold shadow-xl shadow-white/10 hover:shadow-2xl hover:shadow-white/20 bg-white text-black hover:bg-neutral-100 transition-all border border-transparent hover:scale-105"
            onClick={() => router.push("/login?reason=claim")}
          >
            Claim your link now <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:justify-center gap-3">
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 text-white text-sm font-medium border border-white/10 select-none">
            <Instagram className="w-4 h-4" /> Instagram
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 text-white text-sm font-medium border border-white/10 select-none">
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </div>
          <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 text-white text-sm font-medium border border-white/10 select-none">
            <Twitter className="w-4 h-4" /> Twitter
          </div>
        </div>
      </div>
    </motion.div>
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

  const scrollToPreview = (e: React.MouseEvent) => {
    e.preventDefault();
    const previewEl = document.getElementById("preview-section");
    previewEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white text-neutral-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans overflow-x-hidden">

      {/* Background Gradients (Stripe-style) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50/60 blur-3xl opacity-70 animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[30%] h-[50%] rounded-full bg-purple-50/60 blur-3xl opacity-60 animate-blob [animation-delay:2s]" />
        <div className="absolute bottom-[-20%] left-[20%] w-[50%] h-[40%] rounded-full bg-blue-50/40 blur-3xl opacity-70 animate-blob [animation-delay:4s]" />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 flex h-20 items-center justify-between px-6 lg:px-12 backdrop-blur-md bg-white/70 border-b border-neutral-100/50">
        <div className="flex items-center gap-2.5 font-bold tracking-tight text-xl text-neutral-900">
          <div className="h-7 w-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-sm shadow-sm ring-1 ring-neutral-900/10">
            D
          </div>
          DareToSend
        </div>
        <nav className="flex items-center gap-5 text-sm font-semibold">
          {loading ? (
            <div className="w-[128px] h-10 animate-pulse bg-neutral-100 rounded-full"></div>
          ) : user ? (
            <UserDropdown user={user} />
          ) : (
            <div className="flex items-center gap-5 min-h-[40px]">
              <Link href="/login" className="text-neutral-500 hover:text-neutral-900 transition-colors hidden sm:block">
                Log in
              </Link>
              <Button size="default" className="rounded-full px-6 font-semibold shadow-sm h-10" onClick={() => router.push("/login?reason=claim")}>
                Get Your Link
              </Button>
            </div>
          )}
        </nav>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center pt-20">

        {/* --- Hero Section --- */}
        <section className="w-full min-h-[calc(100svh-80px)] flex flex-col items-center px-6 pt-12 pb-32 md:pt-16 md:pb-40 text-center relative justify-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl space-y-8"
          >
            <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white/50 px-3 py-1 text-sm font-medium text-neutral-600 mb-4 backdrop-blur-sm shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
              The standard for honest conversations
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-neutral-900 leading-[1.05]">
              Dare someone to <br className="hidden md:block" /> send you the truth.
            </h1>

            <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed font-medium">
              A professional, moderation-first anonymous feedback platform. Built for growth, without the noise.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {loading ? (
                <div className="w-48 h-14 animate-pulse bg-neutral-100 rounded-full shrink-0"></div>
              ) : user ? (
                <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-lg shadow-neutral-900/10 hover:shadow-xl hover:shadow-neutral-900/20 transition-all border border-transparent" onClick={() => router.push("/dashboard")}>
                  Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button size="lg" className="rounded-full px-8 h-14 text-base font-semibold shadow-lg shadow-neutral-900/10 hover:shadow-xl hover:shadow-neutral-900/20 transition-all border border-transparent" onClick={() => router.push("/login?reason=claim")}>
                  Claim Your Link <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              )}

              <button
                onClick={scrollToPreview}
                className="rounded-full px-8 h-14 text-base font-semibold text-neutral-600 bg-white border border-neutral-200 shadow-sm hover:bg-neutral-50 hover:text-neutral-900 transition-colors flex items-center gap-2"
              >
                See how it works <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-neutral-400"
          >
            <span className="text-xs font-semibold uppercase tracking-widest">Scroll</span>
            <div className="w-px h-12 bg-gradient-to-b from-neutral-300 to-transparent"></div>
          </motion.div>
        </section>

        {/* --- Product Preview Section --- */}
        <section id="preview-section" className="w-full py-40 px-6 bg-neutral-50/50 border-y border-neutral-100">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="flex-1 space-y-8 text-center lg:text-left transition-all duration-500">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                A simple link.<br /> Powerful insights.
              </h2>
              <p className="text-xl text-neutral-500 font-medium max-w-lg mx-auto lg:mx-0 leading-relaxed">
                Copy your unique URL and paste it on Twitter, add it to your Instagram bio, or share it in your Slack. People can leave feedback instantly, without logging in.
              </p>
            </div>

            <div className="flex-1 w-full flex justify-center lg:justify-end">
              <MockPreview />
            </div>
          </div>
        </section>

        {/* --- Share Anywhere Animated Section --- */}
        <section className="w-full py-32 px-6 bg-white overflow-hidden flex flex-col items-center">
          <div className="max-w-6xl w-full mx-auto flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-24">

            <div className="flex-1 w-full flex justify-center lg:justify-start order-2 lg:order-1">
              <ShareAnywhereAnimation />
            </div>

            <div className="flex-1 space-y-8 text-center lg:text-left order-1 lg:order-2">
              <div className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-sm font-semibold text-neutral-600 mb-2">
                Global Reach
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                Share it anywhere.
              </h2>
              <p className="text-xl text-neutral-500 font-medium leading-relaxed">
                You can paste your link anywhere online and start receiving anonymous feedback instantly from anyone.
              </p>

              <div className="pt-4 space-y-4">
                <p className="text-sm font-semibold text-neutral-400 uppercase tracking-widest text-left hidden lg:block">Works natively on</p>
                <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                  <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-neutral-50 text-neutral-700 text-sm font-medium border border-neutral-200/60 shadow-sm">
                    <Instagram className="w-4 h-4 text-pink-600" /> Instagram
                  </div>
                  <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-neutral-50 text-neutral-700 text-sm font-medium border border-neutral-200/60 shadow-sm">
                    <MessageCircle className="w-4 h-4 text-green-500" /> WhatsApp
                  </div>
                  <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-neutral-50 text-neutral-700 text-sm font-medium border border-neutral-200/60 shadow-sm">
                    <Twitter className="w-4 h-4 text-blue-400" /> Twitter
                  </div>
                  <div className="flex items-center gap-2 py-2 px-4 rounded-xl bg-neutral-50 text-neutral-700 text-sm font-medium border border-neutral-200/60 shadow-sm">
                    <Linkedin className="w-4 h-4 text-blue-600" /> LinkedIn
                  </div>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* --- Example Messages (Sequential) --- */}
        <section className="w-full py-32 px-6 relative overflow-hidden flex flex-col items-center">
          <div className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-16">What you might hear</div>
          <ExampleMessages />
        </section>

        {/* --- How It Works --- */}
        <section className="w-full py-32 px-6 bg-white border-y border-neutral-100">
          <div className="max-w-6xl mx-auto flex flex-col items-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900 mb-20 text-center">
              Effortless process
            </h2>
            <HowItWorks />
          </div>
        </section>

        {/* --- Trust & Safety --- */}
        <section className="w-full py-24 md:py-32 px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 shadow-sm">
              <Shield className="w-8 h-8" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-neutral-900">
              Your peace of mind,<br /> built-in.
            </h2>
            <p className="text-lg text-neutral-500 font-medium max-w-xl mx-auto leading-relaxed">
              Every message passes through an automated moderation layer. We filter out harassment, hate speech, and spam before it ever reaches your dashboard. You only see what matters.
            </p>
          </div>
        </section>

        {/* --- Viral Final CTA --- */}
        <section className="w-full py-32 px-6 bg-neutral-50 border-t border-neutral-100">
          <ViralShareSection />
        </section>

      </main>

      <ScrollNavButton />

      <footer className="relative z-10 border-t border-neutral-200 bg-white py-12 px-6 lg:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 font-bold text-neutral-900">
            <div className="h-6 w-6 rounded bg-neutral-900 text-white flex items-center justify-center text-xs">D</div>
            DareToSend
          </div>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-sm font-medium text-neutral-500">
            <Link href="/legal/terms" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Terms of Service</Link>
            <Link href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Privacy Policy</Link>
            <Link href="/legal/acceptable-use" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 transition-colors">Acceptable Use</Link>
          </div>
          <div className="text-sm font-medium text-neutral-400">
            © {new Date().getFullYear()} All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
