"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { IconMapPin, IconCalendar, IconChevronDown } from "@tabler/icons-react"
import { formatDate } from "@/utils/formatDate"
import { Badge } from "@/components/ui/badge"
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
    <div className="space-y-4 p-4">
      <DownloadInvoiceButton />
      {filteredData.map((load) => (
        <Card key={load.id} className="cursor-pointer p-0">
          <Collapsible>
            {/* --- Collapsible Trigger (Card Header) --- */}
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition rounded-xl data-[state=open]:rounded-t-xl data-[state=open]:rounded-b-none">
                <div className="flex flex-col w-full">
                  <div className="font-semibold text-lg justify-between flex pr-4">
                    <span>
                      {load.broker_name || "N/A"} / {load.agent_name || "N/A"}
                    </span>
                    <div className="flex items-center gap-4">
                      <span>
                        ${load.rate || "0.00"}
                      </span>
                    </div>

                  </div>
                  <span className="text-muted-foreground text-sm">
                    {load.invoice_number || "N/A"} • {load.load_number || "N/A"}
                  </span>
                  <div className="text-blue-400 text-sm">
                    DUE IN {load.invoice_date || "5 DAYS"}
                  </div>
                </div>
                <IconChevronDown className="h-5 w-5 transition-transform data-[state=open]:rotate-180" />
              </div>
            </CollapsibleTrigger>


            {/* --- Collapsible Content (Details) --- */}
            <CollapsibleContent>
              <CardContent className="flex flex-col gap-4 border-t p-4">
                {/* Invoice / Load / Broker / Agent */}
                <div className="flex flex-col md:flex-row md:gap-6">
                  <div className="flex-1">
                    <span className="text-gray-400 text-sm">Invoice / Load</span>
                    <div className="font-semibold text-lg">
                      {load.invoice_number || "N/A"} / {load.load_number || "N/A"}
                      <Badge variant="outline" className="ml-2 capitalize">
                        {load.status || "new"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1 mt-2 md:mt-0">
                    <span className="text-gray-400 text-sm">Broker / Agent</span>
                    <div className="font-semibold">
                      {load.broker_name || "N/A"} / {load.agent_name || "N/A"}
                    </div>
                  </div>
                </div>

                {/* Pickup → Delivery */}
                <div className="flex flex-col md:flex-row md:gap-6">
                  <div className="flex-1 mt-2 md:mt-0">
                    <span className="text-gray-400 text-sm">Pickup → Delivery</span>
                    <div className="flex items-center space-x-2 mt-1">
                      <IconMapPin size={16} className="text-gray-300" />
                      <span>{formatCityState(load.stops[0]?.location) || "N/A"}</span>
                      <span className="text-gray-400">→</span>
                      <span>{formatCityState(load.stops[load.stops.length - 1]?.location) || "N/A"}</span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <IconCalendar size={16} className="text-gray-300" />
                      <span>{formatDate(load.stops[0]?.appointment_time) || "N/A"}</span>
                      <span className="text-gray-400">→</span>
                      <span>{formatDate(load.stops[load.stops.length - 1]?.window_start) || "N/A"}</span>
                    </div>
                  </div>
                  <div className="flex-1 mt-4 md:mt-0 flex items-start md:items-center justify-between">
                    <div>
                      <span className="text-gray-400 text-sm">Rate</span>
                      <div className="font-semibold text-lg">${load.rate || "0.00"}</div>
                      <div>
                        <span className="text-blue-400 text-md">DUE IN {load.invoice_date || "5 DAYS"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* "View Full Details" link */}
                <div className="pt-2">
                  <Link href={`/loads/${load.id}`} className="text-primary text-sm hover:underline">
                    View Full Load Details →
                  </Link>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </div>
  )
}
