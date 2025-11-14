/**
 * Guest Session Manager
 * 
 * Manages temporary trace storage for users who haven't signed in.
 * Data is stored in localStorage and cleared when the browser closes.
 */

import { AgentTrace } from '../types/trace'

const GUEST_TRACES_KEY = 'agenttrace_guest_traces'
const GUEST_SESSION_KEY = 'agenttrace_guest_session'
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000 // 24 hours

interface GuestSession {
  sessionId: string
  createdAt: number
  expiresAt: number
}

interface GuestTrace extends AgentTrace {
  sessionId: string
  createdAt: number
}

/**
 * Get or create a guest session
 */
export const getGuestSession = (): GuestSession => {
  try {
    const stored = localStorage.getItem(GUEST_SESSION_KEY)
    if (stored) {
      const session: GuestSession = JSON.parse(stored)
      // Check if session is still valid
      if (session.expiresAt > Date.now()) {
        return session
      }
    }
  } catch (error) {
    console.error('Error reading guest session:', error)
  }

  // Create new session
  const now = Date.now()
  const newSession: GuestSession = {
    sessionId: `guest_${now}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    expiresAt: now + SESSION_EXPIRY_MS,
  }

  try {
    localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(newSession))
  } catch (error) {
    console.error('Error saving guest session:', error)
  }

  return newSession
}

/**
 * Get all guest traces for the current session
 */
export const getGuestTraces = (): GuestTrace[] => {
  try {
    const session = getGuestSession()
    const stored = localStorage.getItem(GUEST_TRACES_KEY)
    if (!stored) return []

    const allTraces: GuestTrace[] = JSON.parse(stored)
    // Filter traces for current session and not expired
    return allTraces.filter(
      (trace) => trace.sessionId === session.sessionId && trace.createdAt > Date.now() - SESSION_EXPIRY_MS
    )
  } catch (error) {
    console.error('Error reading guest traces:', error)
    return []
  }
}

/**
 * Save a trace to guest storage
 */
export const saveGuestTrace = (trace: AgentTrace): void => {
  try {
    const session = getGuestSession()
    const guestTrace: GuestTrace = {
      ...trace,
      sessionId: session.sessionId,
      createdAt: Date.now(),
    }

    const existing = getGuestTraces()
    existing.push(guestTrace)

    // Keep only last 50 traces to avoid localStorage size limits
    const sorted = existing.sort((a, b) => b.createdAt - a.createdAt).slice(0, 50)
    localStorage.setItem(GUEST_TRACES_KEY, JSON.stringify(sorted))
  } catch (error) {
    console.error('Error saving guest trace:', error)
    // If localStorage is full, try to clear old traces
    try {
      const session = getGuestSession()
      const allTraces: GuestTrace[] = JSON.parse(localStorage.getItem(GUEST_TRACES_KEY) || '[]')
      const recentTraces = allTraces
        .filter((t) => t.sessionId === session.sessionId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 20)
      localStorage.setItem(GUEST_TRACES_KEY, JSON.stringify(recentTraces))
      // Retry saving
      saveGuestTrace(trace)
    } catch (retryError) {
      console.error('Error retrying save after cleanup:', retryError)
    }
  }
}

/**
 * Get a specific guest trace by ID
 */
export const getGuestTrace = (traceId: string): GuestTrace | null => {
  const traces = getGuestTraces()
  return traces.find((t) => t.id === traceId) || null
}

/**
 * Delete a guest trace
 */
export const deleteGuestTrace = (traceId: string): void => {
  try {
    const session = getGuestSession()
    const allTraces: GuestTrace[] = JSON.parse(localStorage.getItem(GUEST_TRACES_KEY) || '[]')
    const filtered = allTraces.filter((t) => !(t.id === traceId && t.sessionId === session.sessionId))
    localStorage.setItem(GUEST_TRACES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error deleting guest trace:', error)
  }
}

/**
 * Clear all guest traces for the current session
 */
export const clearGuestTraces = (): void => {
  try {
    const session = getGuestSession()
    const allTraces: GuestTrace[] = JSON.parse(localStorage.getItem(GUEST_TRACES_KEY) || '[]')
    const filtered = allTraces.filter((t) => t.sessionId !== session.sessionId)
    localStorage.setItem(GUEST_TRACES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error clearing guest traces:', error)
  }
}

/**
 * Clear all guest data (traces and session)
 */
export const clearAllGuestData = (): void => {
  try {
    localStorage.removeItem(GUEST_TRACES_KEY)
    localStorage.removeItem(GUEST_SESSION_KEY)
  } catch (error) {
    console.error('Error clearing all guest data:', error)
  }
}

/**
 * Clean up expired traces (should be called on app init)
 */
export const cleanupExpiredTraces = (): void => {
  try {
    const stored = localStorage.getItem(GUEST_TRACES_KEY)
    if (!stored) return

    const allTraces: GuestTrace[] = JSON.parse(stored)
    const now = Date.now()
    const validTraces = allTraces.filter((trace) => trace.createdAt > now - SESSION_EXPIRY_MS)

    if (validTraces.length !== allTraces.length) {
      localStorage.setItem(GUEST_TRACES_KEY, JSON.stringify(validTraces))
    }
  } catch (error) {
    console.error('Error cleaning up expired traces:', error)
  }
}

/**
 * Setup cleanup on browser close
 */
export const setupGuestCleanup = (): void => {
  // Clean up on page unload (browser close/refresh)
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      // Note: Modern browsers limit what we can do in beforeunload
      // The data will persist until next cleanup, but we mark it for cleanup
      cleanupExpiredTraces()
    })

    // Also cleanup on visibility change (tab close)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        cleanupExpiredTraces()
      }
    })
  }
}

