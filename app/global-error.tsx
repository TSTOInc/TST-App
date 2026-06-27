"use client"

import React from "react"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  const [count, setCount] = React.useState(10)
  const [autoReload, setAutoReload] = React.useState(true)
  const [htmlClass, setHtmlClass] = React.useState("")

  // Copy theme classes from real <html> to this isolated <html>
  React.useEffect(() => {
    const original = document.documentElement.className
    setHtmlClass(original)
  }, [])

  React.useEffect(() => {
    if (!autoReload) return

    const interval = setInterval(() => {
      setCount((c) => {
        if (c <= 1) window.location.reload()
        return c - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [autoReload])

  return (
    <html className={htmlClass}>
      <body className="min-h-screen w-full flex items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle className="text-2xl">
              Something went wrong
            </EmptyTitle>
            <EmptyDescription>
              {error?.message || "An unexpected client error occurred."}
            </EmptyDescription>
          </EmptyHeader>

          <EmptyContent>
            <EmptyDescription className="flex flex-col gap-4 text-center">
              {autoReload && (
                <p className="text-sm text-muted-foreground">
                  Reloading automatically in <strong>{count}</strong> seconds…
                </p>
              )}

              <div className="flex flex-row gap-2">
                <Button
                  variant="secondary"
                  onClick={() => (window.location.href = "/")}
                >
                  Go Home
                </Button>
                <Button onClick={() => window.location.reload()}>
                  Reload Now
                </Button>
              </div>

              <span className="text-sm mt-2">
                Need help?{" "}
                <a className="underline" href="#">
                  Contact support
                </a>
              </span>
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      </body>
    </html>
  )
}
