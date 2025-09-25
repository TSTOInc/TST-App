"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { IconMapPin, IconEye } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import DownloadInvoiceButton from "../../components/custom/DownloadInvoice"
import SearchBar from "@/components/ui/search-bar"
import { useSearchParams, useRouter } from "next/navigation"
import FiltersToolbar from "@/components/ui/filters-toolbar"




export default function TablePage() {

  const searchParams = useSearchParams()
  const router = useRouter()

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    minRate: searchParams.get("minRate") || "",
    maxRate: searchParams.get("maxRate") || "",
    loadType: searchParams.get("loadType") || "",
    dateRange: searchParams.get("dateRange") || "",
  })
const updateFilters = (newFilters, newSearchQuery = searchQuery) => {
  const updatedFilters = { ...filters, ...newFilters }
  setFilters(updatedFilters)

  const params = new URLSearchParams()

  // Add search query if exists
  if (newSearchQuery) params.set("q", newSearchQuery)

  // Add filters
  Object.entries(updatedFilters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })

  router.replace(`?${params.toString()}`, { scroll: false })
}



  const [searchQuery, setSearchQuery] = useState("")

  const q = searchParams.get("q")?.toLowerCase() || ""

  const formatCityState = (address) => {
    if (!address) return "N/A"
    const parts = address.split(",").map((p) => p.trim())
    if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    return address
  }

  const formatDueDate = (invoiceDateStr, daysToPay, paidDateStr) => {
    if (!invoiceDateStr || !daysToPay) {
      return { text: "IN PROGRESS", color: "text-gray-400" }
    }

    const invoiceDate = new Date(invoiceDateStr)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(invoiceDate.getDate() + daysToPay)

    const now = new Date()
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (paidDateStr) return { text: "PAID", color: "text-green-500" }
    if (diffDays === 0) return { text: "DUE TODAY", color: "text-blue-400" }
    if (diffDays < 0) {
      return {
        text: `OVERDUE BY ${Math.abs(diffDays)} DAY${Math.abs(diffDays) > 1 ? "S" : ""}`,
        color: "text-red-500",
      }
    }
    return {
      text: `DUE IN ${diffDays} DAY${diffDays > 1 ? "S" : ""}`,
      color: "text-blue-400",
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`https://tst.api.incashy.com/get/loads`, { cache: "no-cache" })
        if (!res.ok) throw new Error("Failed to fetch data")
        const json = await res.json()
        setData(Array.isArray(json) ? json : [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading)
    return (
      <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
        <h1 className="text-6xl lg:text-8xl font-bold mb-4">Loading...</h1>
        <p className="text-xl mb-8">
          Fetching data for <b>Loads</b>...
        </p>
      </main>
    )

  if (error) return <div className="text-red-500 text-center mt-8">Error: {error}</div>
  if (!data || data.length === 0)
    return (
      <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
        <h1 className="text-6xl lg:text-8xl font-bold mb-4">No Data</h1>
        <p className="text-xl mb-8">
          We couldn't find any data for <b>Loads</b>.
        </p>
      </main>
    )

  // Clean raw data
  const cleanedData = data.map(({ created_at, updated_at, ...rest }) => rest)

  // Apply filters
const filteredData = cleanedData.filter((load) => {
  const query = q.toLowerCase()

  // Search filter
  const matchesSearch =
    !q || 
    load.broker_name?.toLowerCase().includes(query) ||
    load.invoice_number?.toLowerCase().includes(query) ||
    load.load_number?.toLowerCase().includes(query)

  // Status filter
  let matchesStatus = true
  if (filters.status) {
    if (filters.status === "in_progress") {
      const inProgressStatuses = ["new", "at_pickup", "in_transit", "delivered"]
      matchesStatus = inProgressStatuses.includes(load.load_status)
    } else {
      matchesStatus = load.load_status === filters.status
    }
  }

  // Load type filter
  const matchesLoadType = !filters.loadType || load.load_type === filters.loadType

  // Rate filters
  const matchesMinRate = !filters.minRate || Number(load.rate) >= Number(filters.minRate)
  const matchesMaxRate = !filters.maxRate || Number(load.rate) <= Number(filters.maxRate)

  // Date range filter
  let matchesDate = true
  if (filters.dateRange) {
    const invoiceDate = new Date(load.created_at)
    const now = new Date()
    switch (filters.dateRange) {
      case "last_7":
        matchesDate = (now - invoiceDate) / (1000 * 60 * 60 * 24) <= 7
        break
      case "last_30":
        matchesDate = (now - invoiceDate) / (1000 * 60 * 60 * 24) <= 30
        break
      case "this_month":
        matchesDate =
          invoiceDate.getMonth() === now.getMonth() &&
          invoiceDate.getFullYear() === now.getFullYear()
        break
      case "last_month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        matchesDate =
          invoiceDate.getMonth() === lastMonth.getMonth() &&
          invoiceDate.getFullYear() === lastMonth.getFullYear()
        break
    }
  }

  // Return true only if it passes all checks
  return matchesSearch && matchesStatus && matchesLoadType && matchesMinRate && matchesMaxRate && matchesDate
})




  return (
    <div className="p-4 space-y-4">
      <SearchBar live={true} onSearch={(q) => setSearchQuery(q)} placeholder="Search broker, invoice, or load number" />
      <FiltersToolbar
        filters={filters}
        setFilters={updateFilters}   // <-- use this instead of direct setFilters
        onClear={() => updateFilters({ status: "", minRate: "", maxRate: "", loadType: "", dateRange: "" })}
      />

      <div className="flex gap-4">
        {/* Left Column - Filters */}


        {/* Right Column - Results */}
        <div className="flex-1 space-y-4">
          {filteredData.map((load) => {
            const status = formatDueDate(load.invoiced_at, load.payment_days_to_pay, load.paid_at)

            return (
              <Card key={load.id} className="p-0">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition rounded-xl">
                  <div className="flex flex-col w-full">
                    <div className="font-semibold text-lg justify-between flex pr-4">
                      <span>
                        {load.broker_name || "N/A"}
                        <Badge status={load.load_status} className="ml-2 capitalize">
                          {load.load_status || "new"}
                        </Badge>
                      </span>
                      <div className="flex items-center gap-4">
                        <span>${load.rate || "0.00"}</span>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {load.invoice_number || "N/A"} • {load.load_number || "N/A"}
                    </span>
                    <div className="flex items-center space-x-2 mt-1">
                      <IconMapPin size={16} />
                      <span>{formatCityState(load.stops[0]?.location) || "N/A"}</span>
                      <span className="text-gray-400">→</span>
                      <span>{formatCityState(load.stops[load.stops.length - 1]?.location) || "N/A"}</span>
                    </div>

                    <div className={`text-md ${status.color}`}>{status.text}</div>

                    <div className="flex justify-end mt-2">
                      <Button className="px-8 py-5" asChild>
                        <Link href={`/loads/${load.id}`} className="flex items-center">
                          <IconEye className="mr-2" />
                          View Load
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>

  )
}
