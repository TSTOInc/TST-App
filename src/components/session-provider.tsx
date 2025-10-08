"use client"

import { createContext, useContext } from "react"

type Session = {
  user: {
    name?: string
    email?: string
    picture?: string
    nickname?: string
    org_id?: string
  }
} | null

const SessionContext = createContext<Session>(null)

export function SessionProvider({ value, children }: { value: Session, children: React.ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) {
    console.warn("useSession called outside of SessionProvider")
  }
  return session
}
