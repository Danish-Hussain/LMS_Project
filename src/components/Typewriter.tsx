"use client"

import { useEffect, useRef, useState } from 'react'

type Props = {
  messages: string[]
  typingSpeed?: number // ms per character
  pauseBetween?: number // ms to pause after a message
  className?: string
  loop?: boolean
}

export default function Typewriter({
  messages,
  typingSpeed = 35,
  pauseBetween = 1800,
  className,
  loop = true,
}: Props) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!messages.length) return

    const current = messages[msgIndex]
    const isDone = charIndex >= current.length

    if (isDone) {
      timeoutRef.current = setTimeout(() => {
        const next = msgIndex + 1
        if (next < messages.length) {
          setMsgIndex(next)
          setCharIndex(0)
        } else if (loop) {
          setMsgIndex(0)
          setCharIndex(0)
        }
      }, pauseBetween)
    } else {
      timeoutRef.current = setTimeout(() => setCharIndex((c) => c + 1), typingSpeed)
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [messages, msgIndex, charIndex, typingSpeed, pauseBetween, loop])

  const text = messages[msgIndex]?.slice(0, charIndex) ?? ''

  return (
    <div className={className} aria-live="polite">
      <span>{text}</span>
      <span className="ml-1 inline-block w-[2px] h-5 align-[-2px] bg-current/80 dark:bg-white/70 animate-pulse rounded-sm" />
    </div>
  )
}
