import { PostHog } from "posthog-node"
import type { EventMap } from "./events"

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

const globalForPostHog = globalThis as unknown as {
  posthogServer: PostHog | undefined
}

function getClient(): PostHog | null {
  if (!POSTHOG_KEY) return null

  if (!globalForPostHog.posthogServer) {
    globalForPostHog.posthogServer = new PostHog(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return globalForPostHog.posthogServer
}

export function trackServerEvent<K extends keyof EventMap>(
  userId: string,
  event: K,
  properties: EventMap[K]
): void {
  try {
    const client = getClient()
    if (!client) return

    client.capture({
      distinctId: userId,
      event,
      properties,
    })
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[analytics] Failed to track ${event}`, e)
    }
  }
}
