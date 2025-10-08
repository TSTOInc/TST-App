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

type Organization = {
  id: string
  name: string
} | null

// Create two contexts
const SessionContext = createContext<Session>(null)
const OrganizationContext = createContext<Organization>(null)

export function SessionProvider({
  value,
  organization,
  children,
}: {
  value: Session
  organization: Organization
  children: React.ReactNode
}) {
  return (
    <SessionContext.Provider value={value}>
      <OrganizationContext.Provider value={organization}>
        {children}
      </OrganizationContext.Provider>
    </SessionContext.Provider>
  )
}

export function useSession() {
  const session = useContext(SessionContext)
  if (!session) {
    console.warn("useSession called outside of SessionProvider")
  }
  return session
}

export function useOrganization() {
  const organization = useContext(OrganizationContext)
  if (!organization) {
    console.warn("useOrganization called outside of SessionProvider")
  }
  return organization
}
