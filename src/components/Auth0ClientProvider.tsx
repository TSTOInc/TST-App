// components/Auth0ClientProvider.tsx
"use client"

import { ReactNode } from "react"
import { Auth0Provider } from "@auth0/auth0-react"

export function Auth0ClientProvider({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider
      domain={process.env.NEXT_PUBLIC_AUTH0_DOMAIN!}
      clientId={process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID!}
      authorizationParams={{
        redirect_uri: typeof window !== "undefined" ? window.location.origin : undefined,
        audience: process.env.NEXT_PUBLIC_AUTH0_API_AUDIENCE,
      }}
      useRefreshTokens={true}
      cacheLocation="memory"
    >
      {children}
    </Auth0Provider>
  )
}
