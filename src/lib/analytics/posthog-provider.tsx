"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react"
import { useEffect, useRef } from "react"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

export function PostHogProvider({
  children,
  userId,
}: {
  children: React.ReactNode
  userId?: string
}) {
  const initialized = useRef(false)

  useEffect(() => {
    if (!POSTHOG_KEY || initialized.current) return
    initialized.current = true

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      autocapture: false,
      capture_pageview: false,
      persistence: "memory",
    })
  }, [])

  if (!POSTHOG_KEY) {
    return <>{children}</>
  }

  return (
    <PHProvider client={posthog}>
      {userId && <PostHogIdentify userId={userId} />}
      {children}
    </PHProvider>
  )
}

function PostHogIdentify({ userId }: { userId: string }) {
  const ph = usePostHog()

  useEffect(() => {
    if (userId) {
      ph.identify(userId)
    }
  }, [ph, userId])

  return null
}
