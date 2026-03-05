"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Link as LinkIcon, CheckCircle2 } from "lucide-react"

type AnimationState = 
  | "profile_initial" 
  | "link_added" 
  | "link_clicked" 
  | "form_typing" 
  | "message_sent"

export function ShareAnywhereAnimation() {
  const [animState, setAnimState] = useState<AnimationState>("profile_initial")
  const [typedText, setTypedText] = useState("")
  
  const TYPING_MESSAGE = "You explain things really clearly."

  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    let typeInterval: NodeJS.Timeout

    const runSequence = () => {
      // 1. Initial Profile State (wait 1.5s)
      setAnimState("profile_initial")
      setTypedText("")
      
      timeoutId = setTimeout(() => {
        // 2. Link Appears (wait 1.5s)
        setAnimState("link_added")
        
        timeoutId = setTimeout(() => {
          // 3. Link Clicked (brief flash, wait 0.5s)
          setAnimState("link_clicked")
          
          timeoutId = setTimeout(() => {
            // 4. Form Sliding In (wait 0.8s for transition)
            setAnimState("form_typing")
            
            timeoutId = setTimeout(() => {
              // 5. Start Typing Effect
              let i = 0;
              typeInterval = setInterval(() => {
                setTypedText(TYPING_MESSAGE.substring(0, i + 1))
                i++
                
                if (i === TYPING_MESSAGE.length) {
                  clearInterval(typeInterval)
                  // Wait 1s after typing finishes
                  timeoutId = setTimeout(() => {
                    // 6. Message Sent (wait 2.5s before looping)
                    setAnimState("message_sent")
                    
                    timeoutId = setTimeout(() => {
                      runSequence() // LOOP
                    }, 2500)
                  }, 1000)
                }
              }, 40) // Typing speed
            }, 800)
          }, 500)
        }, 1500)
      }, 1500)
    }

    runSequence()

    return () => {
      clearTimeout(timeoutId)
      clearInterval(typeInterval)
    }
  }, [])

  return (
    <div className="relative w-full max-w-[320px] mx-auto h-[480px] flex items-center justify-center p-4">
      {/* Decorative blurred backdrop */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 blur-3xl rounded-full" />
      
      <div className="relative w-full h-full bg-white rounded-[2.5rem] border-[6px] border-neutral-100 shadow-2xl overflow-hidden flex flex-col bg-grid-neutral-100/30">
        
        {/* Top Status Bar Mock */}
        <div className="h-6 w-full flex justify-center items-end pb-1 absolute top-0 z-20">
            <div className="w-1/3 h-1.5 bg-neutral-200 rounded-full" />
        </div>

        <AnimatePresence mode="wait">
          
          {/* STATE 1, 2, 3: PROFILE VIEW */}
          {(animState === "profile_initial" || animState === "link_added" || animState === "link_clicked") && (
            <motion.div 
              key="profile_view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-white flex flex-col pt-12"
            >
              {/* Profile Header */}
              <div className="flex flex-col items-center px-6 pt-4 pb-6 border-b border-neutral-100">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-neutral-100 to-neutral-200 relative mb-4 p-1">
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center border-2 border-white">
                        <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            G
                        </div>
                    </div>
                </div>
                <h3 className="font-bold text-neutral-900 text-lg tracking-tight">Gaurav</h3>
                <p className="text-sm text-neutral-500 mt-1">Building cool things.</p>
                
                {/* The magically appearing link */}
                <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ 
                        opacity: animState === "link_added" || animState === "link_clicked" ? 1 : 0, 
                        height: animState === "link_added" || animState === "link_clicked" ? "auto" : 0,
                        marginTop: animState === "link_added" || animState === "link_clicked" ? 12 : 0
                    }}
                    className="overflow-hidden w-full flex justify-center"
                >
                    <motion.div 
                        animate={{ 
                            scale: animState === "link_clicked" ? 0.95 : 1,
                            backgroundColor: animState === "link_clicked" ? "rgba(224, 231, 255, 1)" : "rgba(238, 242, 255, 1)"
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-sm font-medium border border-indigo-100/50"
                    >
                        <LinkIcon className="w-3.5 h-3.5" />
                        daretosend.eu.cc/gaurav
                    </motion.div>
                </motion.div>
              </div>

              {/* Fake Grid */}
              <div className="flex-1 p-1 flex flex-wrap gap-1 content-start mt-2">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="w-[calc(33.333%-4px)] aspect-square bg-neutral-100 rounded-md" />
                ))}
              </div>
            </motion.div>
          )}

          {/* STATE 4, 5, 6: FORM VIEW */}
          {(animState === "form_typing" || animState === "message_sent") && (
            <motion.div 
              key="form_view"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 bg-neutral-50 flex flex-col items-center pt-20 px-5"
            >
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-100 to-purple-100 flex items-center justify-center shadow-sm mb-4">
                     <span className="font-bold bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent">G</span>
                </div>
                <h4 className="font-bold text-neutral-900 mb-1 text-center leading-tight">Send anonymous feedback</h4>
                
                <div className="w-full mt-6 space-y-3">
                    <div className="w-full bg-white border border-neutral-200 rounded-2xl p-3 h-[100px] shadow-sm relative">
                        <span className={`text-sm ${typedText.length === 0 ? 'text-neutral-400' : 'text-neutral-900 font-medium'}`}>
                            {typedText.length === 0 ? "Type your message..." : typedText}
                            {animState === "form_typing" && (
                                <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse align-middle" />
                            )}
                        </span>
                    </div>

                    <motion.div 
                        animate={{ 
                            backgroundColor: animState === "message_sent" ? "#4f46e5" : "#171717",
                            scale: animState === "message_sent" ? [1, 0.97, 1] : 1
                        }}
                        transition={{ duration: 0.3 }}
                        className="w-full h-[44px] rounded-xl flex items-center justify-center gap-2 text-white text-sm font-semibold shadow-md overflow-hidden"
                    >
                        <AnimatePresence mode="wait">
                            {animState === "message_sent" ? (
                                <motion.div 
                                    key="sent"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <CheckCircle2 className="w-4 h-4 text-indigo-200" /> Sent Response
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="send"
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="flex items-center gap-1.5"
                                >
                                    <Shield className="w-4 h-4 text-neutral-400" /> Send anonymously
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
