"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { IconSearch } from "@tabler/icons-react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ButtonGroup } from "@/components/ui/button-group"



interface SearchBarProps {
  live?: boolean
  placeholder?: string
}

export default function SearchBar({ live = true, placeholder }: SearchBarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  const [query, setQuery] = useState("")
  const initialized = useRef(false) // only set once on page load

  // Sync initial query once
  useEffect(() => {
    if (!initialized.current) {
      setQuery(initialQuery)
      initialized.current = true
    }
  }, [initialQuery])

  // Debounce live search
  useEffect(() => {
    if (!live) return
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (query.trim()) {
        params.set("q", query.trim())
      } else {
        params.delete("q")
      }
      router.push(`?${params.toString()}`)
    }, 100)

    return () => clearTimeout(handler)
  }, [query, live, router, searchParams])

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (query.trim()) {
      params.set("q", query.trim())
    } else {
      params.delete("q")
    }
    router.push(`?${params.toString()}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!live && e.key === "Enter") handleSearch()
  }

  return (
    <ButtonGroup className="[--radius:9999rem] mx-auto flex w-full items-center mb-6 max-w-xl">
      <Input
        type="text"
        placeholder={placeholder || "Search carriers..."}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <Button type="button" variant="outline" aria-label="Search" onClick={handleSearch}>
        <IconSearch />
      </Button>
    </ButtonGroup>
  )
}
