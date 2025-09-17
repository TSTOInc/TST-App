"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { IconMapPin, IconCalendar, IconEye } from "@tabler/icons-react"
import { formatDate } from "@/utils/formatDate"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import DownloadInvoiceButton from "../../components/custom/DownloadInvoice"

export default function TablePage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const formatCityState = (address) => {
    if (!address) return "N/A"
    const parts = address.split(",").map(p => p.trim())
    if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    return address
  }
  const formatDueDate = (invoiceDateStr, daysToPay) => {
    if (!invoiceDateStr || !daysToPay) return "N/A"

    const invoiceDate = new Date(invoiceDateStr)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(invoiceDate.getDate() + daysToPay) // Add days to pay

    const now = new Date()

    // Calculate difference in days
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) // convert ms to days

    if (diffDays === 0) return "DUE TODAY"
    if (diffDays < 0) return `OVERDUE BY ${Math.abs(diffDays)} DAY${Math.abs(diffDays) > 1 ? "S" : ""}`
    return `DUE IN ${diffDays} DAY${diffDays > 1 ? "S" : ""}`
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
        <p className="text-xl mb-8">We couldn't find any data for <b>Loads</b>.</p>
      </main>
    )

  const filteredData = data.map(({ created_at, updated_at, ...rest }) => rest)

  return (
    <div className="flex gap-4 p-4">
      {/* Left Column - Fixed width */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <span>Filters</span>
            <Button size="sm">Clear</Button>
          </div>
          {/* Add your filter controls here */}
        </Card>
      </div>

      {/* Right Column - Flexible */}
      <div className="flex-1 space-y-4">
        {filteredData.map((load) => (
          <Card key={load.id} className="p-0">
            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition rounded-xl data-[state=open]:rounded-t-xl data-[state=open]:rounded-b-none">
              <div className="flex flex-col w-full">
                <div className="font-semibold text-lg justify-between flex pr-4">
                  <span>
                    {load.broker_name || "N/A"}
                    <Badge variant="outline" className="ml-2 capitalize">
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
                  <IconMapPin size={16} className="text-gray-300" />
                  <span>{formatCityState(load.stops[0]?.location) || "N/A"}</span>
                  <span className="text-gray-400">→</span>
                  <span>{formatCityState(load.stops[load.stops.length - 1]?.location) || "N/A"}</span>
                </div>
                <div className="text-blue-400 text-md">
                  {formatDueDate(load.invoiced_at, load.payment_days_to_pay)}
                </div>
                <div className="flex justify-end">
                  <Button className="px-8 py-5" asChild>
                    <Link href={`/loads/${load.id}`} className="flex items-center">
                      <IconEye className="mr-2" />View Load
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>

  )
}
