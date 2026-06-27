"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useAuth } from '@clerk/nextjs'

// Component UI
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SearchBar from "@/components/ui/search-bar"
import FiltersToolbar from "@/components/ui/filters-toolbar"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

// Icons & Utils
import { IconMapPin, IconEye, IconZoomQuestion, IconLoader2 } from "@tabler/icons-react"
import { formatCentsToUSD, toCents } from "@/lib/currency"

// ----------------------------------------------------------------------
// Pure Utility Functions (Isolated from Component Render Lifecycle)
// ----------------------------------------------------------------------

const formatCityState = (address) => {
  if (!address) return "N/A"
  const parts = address.split(",").map((p) => p.trim())
  return parts.length >= 2 ? `${parts[parts.length - 2]}, ${parts[parts.length - 1]}` : address
}

const formatDueDate = (invoiceDateStr, daysToPay, paidDateStr) => {
  if (!invoiceDateStr || !daysToPay) {
    return { text: "IN PROGRESS", color: "text-muted-foreground font-semibold dark:font-normal" }
  }
  if (paidDateStr) {
    return { text: "PAID", color: "text-green-500 font-semibold dark:font-normal" }
  }

  const invoiceDate = new Date(invoiceDateStr)
  const dueDate = new Date(invoiceDate)
  dueDate.setDate(invoiceDate.getDate() + daysToPay)

  // Normalize dates to midnight for accurate day-based diffs
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)

  const diffTime = dueDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return { text: "DUE TODAY", color: "text-blue-400 font-semibold dark:font-normal" }
  if (diffDays < 0) {
    const absDays = Math.abs(diffDays)
    return {
      text: `OVERDUE BY ${absDays} DAY${absDays > 1 ? "S" : ""}`,
      color: "text-red-500 font-semibold dark:font-normal",
    }
  }
  return {
    text: `DUE IN ${diffDays} DAY${diffDays > 1 ? "S" : ""}`,
    color: "text-blue-400 font-semibold dark:font-normal",
  }
}

const checkDateRange = (dateStr, rangeType) => {
  if (!dateStr) return false
  const invoiceDate = new Date(dateStr)
  const now = new Date()
  
  // Clear times to compare days accurately
  const diffDays = (now.setHours(0,0,0,0) - invoiceDate.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24)

  switch (rangeType) {
    case "last_7":
      return diffDays <= 7
    case "last_30":
      return diffDays <= 30
    case "this_month":
      return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear()
    case "last_month":
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return invoiceDate.getMonth() === lastMonth.getMonth() && invoiceDate.getFullYear() === lastMonth.getFullYear()
    default:
      return true
  }
}

// ----------------------------------------------------------------------
// Sub-Components (Improves readability and reusability)
// ----------------------------------------------------------------------

const LoadingState = () => (
  <Empty className="border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <IconLoader2 className="animate-spin" />
      </EmptyMedia>
      <EmptyTitle>Fetching Loads...</EmptyTitle>
      <EmptyDescription>Loading data, please wait.</EmptyDescription>
    </EmptyHeader>
  </Empty>
)

const EmptyState = () => (
  <Empty className="border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <IconZoomQuestion />
      </EmptyMedia>
      <EmptyTitle>No Load Found</EmptyTitle>
      <EmptyDescription>Create a new load to get started.</EmptyDescription>
    </EmptyHeader>
    <EmptyContent>
      <Link href="/loads/add">
        <Button variant="outline" size="sm">Add Load</Button>
      </Link>
    </EmptyContent>
  </Empty>
)

const LoadCard = ({ load }) => {
  const status = useMemo(() => 
    formatDueDate(load.invoiced_at, load.payment_days_to_pay, load.paid_at),
    [load.invoiced_at, load.payment_days_to_pay, load.paid_at]
  )

  const origin = useMemo(() => formatCityState(load.stops?.[0]?.location), [load.stops])
  const destination = useMemo(() => formatCityState(load.stops?.[load.stops.length - 1]?.location), [load.stops])

  return (
    <Card className="hover:bg-muted/50 transition py-5 px-4">
      <div className="flex w-full">
        {/* LEFT SIDE */}
        <div className="flex-1 pr-6">
          <div className="font-semibold text-lg flex pr-4">
            <span>
              {load.broker_name || "N/A"}
              <Badge status={load.load_status} className="ml-2 capitalize">
                {load.load_status || "new"}
              </Badge>
            </span>
          </div>

          <span className="text-muted-foreground text-sm">
            {load.invoice_number || "N/A"} • {load.load_number || "N/A"}
          </span>

          <div className="flex items-center space-x-2 mt-1 text-sm">
            <IconMapPin size={16} />
            <span>{origin}</span>
            <span className="text-gray-400">→</span>
            <span>{destination}</span>
          </div>

          <div className={`text-md mt-1 ${status.color}`}>{status.text}</div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex flex-col items-end w-fit pl-4">
          <span className="font-semibold text-xl w-full text-center">
            {formatCentsToUSD(load.rate)}
          </span>
          <div className="flex-1" />
          <Button variant="secondary" className="p-5" asChild>
            <Link href={`/loads/${load._id}`} className="flex items-center gap-1">
              <IconEye size={18} />
              View Load
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------

export default function TablePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { has } = useAuth()

  const loadsUnsorted = useQuery(api.getTable.all, has ? { table: "loads" } : "skip")
  
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    minRate: searchParams.get("minRate") || "",
    maxRate: searchParams.get("maxRate") || "",
    loadType: searchParams.get("loadType") || "",
    dateRange: searchParams.get("dateRange") || "",
  })

  // URL Sync Handler
  const updateFilters = useCallback((newFilters, currentSearch = searchQuery) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)

    const params = new URLSearchParams()
    if (currentSearch) params.set("q", currentSearch)

    Object.entries(updatedFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    router.replace(`?${params.toString()}`, { scroll: false })
  }, [filters, searchQuery, router])

  const handleClearFilters = useCallback(() => {
    updateFilters({
      status: "",
      minRate: "",
      maxRate: "",
      loadType: "",
      dateRange: "",
    })
  }, [updateFilters])

  // Processed Data Memo Pipeline (Sort -> Map -> Filter)
  const filteredData = useMemo(() => {
    if (!loadsUnsorted) return []

    const activeQuery = searchQuery.toLowerCase() || searchParams.get("q")?.toLowerCase() || ""
    const IN_PROGRESS_STATUSES = ["new", "at_pickup", "in_transit", "delivered"]

    return [...loadsUnsorted]
      // 1. Sort Primary Loads
      .sort((a, b) => (Number(b.invoice_number) || 0) - (Number(a.invoice_number) || 0))
      // 2. Map and internalize structure (e.g. Sort Sub-stops)
      .map((load) => {
        if (!load.stops?.length) return load
        const sortedStops = [...load.stops].sort((a, b) => {
          const aTime = new Date(a.appointment_time || a.window_end)
          const bTime = new Date(b.appointment_time || b.window_end)
          return aTime - bTime
        })
        return { ...load, stops: sortedStops }
      })
      // 3. Filter down list
      .filter((load) => {
        const matchesSearch = !activeQuery || 
          load.broker_name?.toLowerCase().includes(activeQuery) ||
          load.invoice_number?.toLowerCase().includes(activeQuery) ||
          load.load_number?.toLowerCase().includes(activeQuery)

        if (!matchesSearch) return false

        const matchesStatus = !filters.status || (
          filters.status === "in_progress" 
            ? IN_PROGRESS_STATUSES.includes(load.load_status)
            : load.load_status === filters.status
        )
        if (!matchesStatus) return false

        const matchesLoadType = !filters.loadType || load.load_type === filters.loadType
        if (!matchesLoadType) return false
        
        const matchesMinRate = !filters.minRate || Number(load.rate) >= toCents(filters.minRate)
        const matchesMaxRate = !filters.maxRate || Number(load.rate) <= toCents(filters.maxRate)
        if (!matchesMinRate || !matchesMaxRate) return false

        // Crucial fix: using load.created_at safely (it was previously deleted via 'cleanedData' map step)
        const matchesDate = !filters.dateRange || checkDateRange(load.created_at, filters.dateRange)
        
        return matchesDate
      })
  }, [loadsUnsorted, searchQuery, searchParams, filters])

  if (!loadsUnsorted) return <LoadingState />

  return (
    <div className="p-4 space-y-4">
      <SearchBar
        live={false}
        value={searchQuery}
        onValueChange={setSearchQuery}
        placeholder="Search broker, invoice, or load number"
      />
      <FiltersToolbar
        filters={filters}
        setFilters={updateFilters}
        onClear={handleClearFilters}
      />

      {filteredData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {filteredData.map((load) => (
            <LoadCard key={load._id} load={load} />
          ))}
        </div>
      )}
    </div>
  )
}