"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import TruckRouteMap from "@/components/custom/TruckRouteMap"
import Loading from "@/components/custom/Loading"
import { Separator } from "@/components/ui/separator"
import {
    DollarSign,
    Package,
    Building2,
    Clock,
    Route,
    FileText,
    MapPin,
    EyeIcon,
} from "lucide-react"

function getStatusColor(status) {
    switch (status) {
        case "at_pickup":
            return "bg-blue-500"
        case "in_transit":
            return "bg-yellow-500"
        case "delivered":
            return "bg-green-500"
        case "pending":
            return "bg-gray-500"
        default:
            return "bg-gray-500"
    }
}

function getStatusProgress(status) {
    switch (status) {
        case "pending":
            return 0
        case "at_pickup":
            return 20
        case "in_transit":
            return 50
        case "delivered":
            return 80
        case "invoiced":
            return 100
        default:
            return 0
    }
}

function formatDate(dateString) {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

function formatStatus(status) {
    return status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

function mapStepToProgress(step, total) {
    return Math.round((step / (total - 1)) * 100)
}

export function LoadDetailsPage({ id }) {

    const getInitialStep = () => {
        if (typeof window === "undefined") return 0
        const saved = localStorage.getItem(`load-progress-step-${id}`)
        return saved !== null ? Number(saved) : 0
    }

    const getInitialProgress = () => {
        if (typeof window === "undefined") return 0
        const saved = localStorage.getItem(`load-progress-${id}`)
        return saved !== null ? Number(saved) : 0
    }

    const [data, setData] = useState(null)
    const [stopsWithCoords, setStopsWithCoords] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [currentStep, setCurrentStep] = useState(getInitialStep)
    const [progress, setProgress] = useState(getInitialProgress)

    useEffect(() => {
        if (!stopsWithCoords.length) return
        const newProgress = mapStepToProgress(currentStep, stopsWithCoords.length + 3)
        setProgress(newProgress)
        localStorage.setItem(`load-progress-step-${id}`, String(currentStep))
        localStorage.setItem(`load-progress-${id}`, String(newProgress))
    }, [currentStep, stopsWithCoords, id])

    const geocodeAddress = async (address) => {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
        )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
        const res = await fetch(url)
        if (!res.ok) throw new Error("Geocoding failed")
        const data = await res.json()
        if (data.features && data.features.length > 0) return data.features[0].geometry.coordinates
        throw new Error(`Could not geocode address: ${address}`)
    }
    function formatTimeRange(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)

  const startDateStr = start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const endDateStr = end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  const startTime = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const endTime = end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // If same date, show: Sep 15, 2025, 08:30 AM - 04:30 PM
  if (startDateStr === endDateStr) {
    return `${startDateStr}, ${startTime} - ${endTime}`
  }

  // If different dates, show: Sep 15, 2025, 08:30 AM - Sep 16, 2025, 04:30 PM
  return `${startDateStr}, ${startTime} - ${endDateStr}, ${endTime}`
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
                const res = await fetch(`https://tst.api.incashy.com/get/loads/${id}`, {
                    cache: "no-cache",
                })
                if (!res.ok) throw new Error("Failed to fetch data")
                const data = await res.json()
                setData(data)

                if (data.stops && data.stops.length > 0) {
                    const stopsWithCoordinates = await Promise.all(
                        data.stops.map(async (stop) => {
                            const coords = await geocodeAddress(stop.location)
                            return {
                                ...stop,
                                coordinates: coords,
                                lat: coords[1],
                                lng: coords[0],
                                type: stop.type.charAt(0).toUpperCase() + stop.type.slice(1),
                            }
                        })
                    )
                    setStopsWithCoords(stopsWithCoordinates)
                }
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    if (loading) return <Loading />
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data) return <div>No carrier data found</div>

    const pickupStop = data.stops?.find((stop) => stop.type === "pickup")
    const deliveryStop = data.stops?.find((stop) => stop.type === "delivery")
    const statusProgress = getStatusProgress(data.load_status)

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            {/* Key Info Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Load Number</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">#{data.load_number}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Invoice Number</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-primary">#{data.invoice_number}</div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rate</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-green-500">
                                ${(Number.parseFloat(data.rate) -  data.rate * (data.payment_term.fee_percent/100)).toFixed(2)}
                            </span>
                            <span className="text-xl font-medium text-blue-400">
                                {formatDueDate(data.invoiced_at, data.payment_term.days_to_pay)}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Base Rate:</span>
                                <span className="text-xs font-medium">${data.rate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Quick Pay ({data.payment_term.fee_percent}%):</span>
                                <span className="text-xs font-medium text-red-500">
                                    -${(Number.parseFloat(data.rate) * data.payment_term.fee_percent/100).toFixed(2)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">Total:</span>
                                <span className="text-xs font-bold text-green-500">
                                    ${(Number.parseFloat(data.rate) -  data.rate * (data.payment_term.fee_percent/100)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Payment Terms:</span>
                                <span className="text-xs font-medium">
                                    {data.payment_term.name}
                                </span>

                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Load Progress
                        <Badge className={`${getStatusColor(data.load_status)} text-white`}>
                            {formatStatus(data.load_status)}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="w-full">Pending</span>
                            <span className="w-full">At Pickup</span>
                            <span className="w-full text-center">In Transit</span>
                            <span className="w-full text-right">Delivered</span>
                            <span className="w-full text-right">Invoiced</span>
                        </div>
                        <Progress value={statusProgress} className="h-3" />
                        <p className="text-sm text-muted-foreground">
                            Current status: {formatStatus(data.load_status)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Load Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Load Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Commodity</p>
                                <p className="text-sm">{data.commodity}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Load Type</p>
                                <p className="text-sm">{data.load_type}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Length</p>
                                <p className="text-sm">{data.length_ft} ft</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Created</p>
                                <p className="text-sm">{formatDate(data.created_at)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Broker Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Broker Information
                            </div>
                            <div>
                                <Button asChild >

                                    <Link href={`/brokers/${data.broker_id}`} >
                                        <EyeIcon />
                                        View Broker
                                    </Link>
                                </Button>
                            </div>

                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Broker Name</p>
                            <p className="text-sm font-semibold">{data.broker_name}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                            <p className="text-sm">{data.broker_address_1}</p>
                            {data.broker_address_2 && <p className="text-sm">{data.broker_address_2}</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Route Info */}
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Route Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="relative">
                    {data.stops.map((stop, index) => (
                      <div key={stop.id} className="relative">
                        <div className="flex items-start gap-3">
                          {/* Marker icon */}
                          <div className="flex flex-col items-center">
                            <MapPin
                              className={`h-5 w-5 ${stop.type === "pickup" ? "text-green-600" : "text-red-600"}`}
                            />
                            {index < data.stops.length - 1 && (
                              <div className="w-px h-16 border-l-2 border-dashed border-muted-foreground/30 mt-2" />
                            )}
                          </div>

                          {/* Stop details */}
                          <div className="flex-1 space-y-1 pb-8">
                            <p className="text-sm font-medium capitalize">{stop.type} Location</p>
                            <p className="text-sm text-muted-foreground">{stop.location}</p>
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {formatTimeRange(stop.window_start, stop.window_end)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

                {/* Map */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            Route Map
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {stopsWithCoords.length > 0 ? (
                            <TruckRouteMap stops={stopsWithCoords} progress={0} />
                        ) : (
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                <div className="text-center space-y-2">
                                    <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
                                    <p className="text-sm text-muted-foreground">
                                        Interactive map will be displayed here
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Showing route from {pickupStop?.location.split(",")[1]?.trim()} to{" "}
                                        {deliveryStop?.location.split(",")[1]?.trim()}
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
