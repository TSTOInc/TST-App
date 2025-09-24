"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from "next-themes"

// Wrapper component
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// ✅ Hook to access theme
export function useTheme() {
  const { theme, setTheme } = useNextTheme()
  return { theme, setTheme }
}
