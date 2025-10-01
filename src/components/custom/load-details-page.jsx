"use client"

import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import TruckRouteMap from "@/components/custom/TruckRouteMap"
import Loading from "@/components/custom/Loading"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DocUpload from "@/components/custom/DocUpload";
import PDFPreview from "@/components/custom/PDFPreview";
import {
    DollarSign,
    Package,
    Building2,
    Clock,
    Route,
    FileText,
    MapPin,
    EyeIcon,
    NotepadText,
    Plus,
    ChevronRight,
    ChevronLeft,
    Upload as IconUpload,
    Trash as IconTrash,
    Loader2 as IconLoader2
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

const handleSendEmail = async () => {
    setSending(true)
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/send/email`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ loadId: load.id }),
        })

        if (!response.ok) {
            throw new Error("Failed to send email")
        }

        const data = await response.json()
        toast.success(data.message)
    } catch (error) {
        toast.error(error.message || "Failed to send email")
    }
}



function getStatusColor(status) {
    switch (status) {
        case "at_pickup":
            return "bg-blue-500"
        case "in_transit":
            return "bg-yellow-500"
        case "delivered":
            return "bg-green-500"
        case "new":
            return "bg-gray-500"
        default:
            return "bg-gray-500"
    }
}

function getStatusProgress(status) {
    switch (status) {
        case "new":
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








const DocumentsCard = ({ load, setTruckData }) => {
    const documents = load?.docs ?? [];
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Please select a document first!");
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const uploadRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE}/upload/image/loads/${load.id}/docs`,
                { method: "POST", body: formData }
            );
            if (!uploadRes.ok) throw new Error("Document Upload failed");
            const { url: documentUrl } = await uploadRes.json();

            const addRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_BASE}/add/loads/${load.id}/docs`,
                { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ document_url: documentUrl }) }
            );
            if (!addRes.ok) throw new Error("Failed to save document to DB");

            // ✅ Refresh documents immediately
            setTruckData(prev => ({ ...prev, docs: [...(prev.docs ?? []), documentUrl] }));

            toast.success("Document uploaded and added successfully!");
            setSelectedFile(null);
            setAddDialogOpen(false);
        } catch (error) {
            toast.error(error.message || "Failed to upload document");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (documentUrl, loadId) => {
        try {
            await toast.promise(
                fetch(`${process.env.NEXT_PUBLIC_API_BASE}/delete/loads/${loadId}/docs`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ document_url: documentUrl }),
                }).then(async (res) => {
                    if (!res.ok) throw new Error("Failed to delete document");

                    // Update local state
                    setTruckData((prev) => ({
                        ...prev,
                        docs: prev.docs.filter((doc) => doc !== documentUrl),
                    }));
                }),
                {
                    loading: "Deleting document...",
                    success: "Document deleted successfully!",
                    error: (err) => err.message || "Failed to delete document",
                }
            );
        } catch (error) {
            console.error(error);
        }
    };



    return (
        <Card className="gap-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Load Documents</CardTitle>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default">
                            <Plus /> Add Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Document</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            <DocUpload onChange={(file) => setSelectedFile(file)} disabled={uploading} />
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                                {uploading ? <><IconLoader2 className='animate-spin' />Uploading Document...</> : <><IconUpload /> Upload Document</>}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>

            <CardContent className="w-full grid gap-4 grid-cols-1 sm:grid-cols-3 md:grid-cols-5 px-4">
                {documents.length === 0 ? (
                    <p className="pt-2 pl-2 text-neutral-500 italic">
                        No documents found for {load.invoice_number || "this load"}.
                    </p>
                ) : (
                    documents.map((doc, idx) => (
                        <Card
                            key={doc.id || idx}
                            className="cursor-pointer"
                            onClick={() => setSelectedDoc(doc)}
                        >
                            <CardContent className="space-y-2 flex justify-center">
                                <PDFPreview
                                    fileUrl={doc}
                                    style={{
                                        border: "none",
                                        pointerEvents: "none",
                                        userSelect: "none",
                                        display: "block",
                                    }}
                                />
                            </CardContent>

                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>
                                    {doc ? decodeURIComponent(doc.split("/").pop()) : "Unnamed Document"}
                                </CardTitle>

                                <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="destructive"
                                            onClick={(e) => e.stopPropagation()} // only if you need to prevent parent clicks
                                        >
                                            <IconTrash />
                                        </Button>
                                    </AlertDialogTrigger>

                                    <AlertDialogContent
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to delete{" "}
                                                <strong>
                                                    {doc
                                                        ? decodeURIComponent(doc.split("/").pop())
                                                        : "Unnamed Document"}
                                                </strong>
                                                ? This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>

                                        <AlertDialogFooter>
                                            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>
                                                Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                                className="bg-destructive text-white hover:bg-destructive/90"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(doc, load.id);
                                                }}
                                            >
                                                <IconTrash className="mr-2 h-4 w-4" />
                                                Delete
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>

                                </AlertDialog>
                            </CardHeader>
                        </Card>

                    ))
                )}
            </CardContent>


            {/* Fullscreen PDF modal */}
            <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
                <DialogContent fullscreen>
                    <DialogHeader>
                        <DialogTitle><span>{""}</span></DialogTitle>
                    </DialogHeader>
                    {selectedDoc && <embed src={selectedDoc} type="application/pdf" width="100%" height="100%" />}
                </DialogContent>
            </Dialog>
        </Card>
    )
};








function getVisibleStepLabels(progress, stops) {
    const labels = ["New"]

    const pickupCount = stops.filter((s) => s.type === "pickup").length
    const deliveryCount = stops.filter((s) => s.type === "delivery").length

    let pickupIndex = 1
    let deliveryIndex = 1
    let stepCounter = 0 // counts detailed steps

    for (const stop of stops) {
        if (stop.type === "pickup") {
            const prefix = pickupCount > 1 ? `${pickupIndex}.- ` : ""
            const atPickupStep = stepCounter + 1
            const pickedUpStep = stepCounter + 2

            if (progress === atPickupStep) {
                labels.push(`${prefix}At Pickup`)
            } else if (progress >= pickedUpStep) {
                labels.push(`${prefix}Picked Up`)
            } else {
                labels.push(`${prefix}Pickup`)
            }

            stepCounter += 2
            pickupIndex++
        } else if (stop.type === "delivery") {
            const prefix = deliveryCount > 1 ? `${deliveryIndex}.- ` : ""
            const atDeliveryStep = stepCounter + 1
            const deliveredStep = stepCounter + 2

            if (progress === atDeliveryStep) {
                labels.push(`${prefix}At Delivery`)
            } else if (progress >= deliveredStep) {
                labels.push(`${prefix}Delivered`)
            } else {
                labels.push(`${prefix}Delivery`)
            }

            stepCounter += 2
            deliveryIndex++
        }
    }

    // Invoice steps
    const invoiceStep = stepCounter + 1
    const paidStep = stepCounter + 2

    if (progress === invoiceStep) {
        labels.push("Invoiced")
    } else if (progress === paidStep) {
        labels.push("Paid")
    } else {
        labels.push("Invoice")
    }

    return labels
}



function buildDetailedSteps(stops) {
    const steps = ["New"]

    const pickupCount = stops.filter((s) => s.type === "pickup").length
    const deliveryCount = stops.filter((s) => s.type === "delivery").length

    let pickupIndex = 1
    let deliveryIndex = 1

    for (const stop of stops) {
        if (stop.type === "pickup") {
            const label = pickupCount > 1 ? `${pickupIndex}.- ` : ""
            steps.push(`${label}At Pickup`)
            steps.push(`${label}Picked Up`)
            pickupIndex++
        } else if (stop.type === "delivery") {
            const label = deliveryCount > 1 ? `${deliveryIndex}.- ` : ""
            steps.push(`${label}At Delivery`)
            steps.push(`${label}Delivered`)
            deliveryIndex++
        }
    }

    steps.push("Invoiced", "Paid")
    return steps
}

function buildVisibleSteps(stops) {
    const steps = ["New"]

    const pickupCount = stops.filter((s) => s.type === "pickup").length
    const deliveryCount = stops.filter((s) => s.type === "delivery").length

    let pickupIndex = 1
    let deliveryIndex = 1

    for (const stop of stops) {
        if (stop.type === "pickup") {
            const label = pickupCount > 1 ? `${pickupIndex}.- Pickup` : "Pickup"
            steps.push(label)
            pickupIndex++
        } else if (stop.type === "delivery") {
            const label = deliveryCount > 1 ? `${deliveryIndex}.- Delivery` : "Delivery"
            steps.push(label)
            deliveryIndex++
        }
    }

    steps.push("Invoice")
    return steps
}


function mapProgressToUI(progress, stops) {
    if (progress === 0) return 0 // "New"

    let uiIndex = 0
    let count = 0

    for (const stop of stops) {
        if (stop.type === "pickup" || stop.type === "delivery") {
            count += 2
            if (progress <= count) {
                return ++uiIndex
            }
            uiIndex++
        }
    }

    return buildVisibleSteps(stops).length - 1 // Invoice
}

function mapLoadToInvoicePayload(load) {
    return {
        id: load.invoice_number || load.id,
        load_number: load.load_number,
        date: load.invoiced_at || load.created_at, // fallback to created_at
        carrier: {
            name: "Three Stars Transport Inc",
            address: "1427 Evanwood Ave",
            address2: "La Puente, California 91744",
            phone: "(619) 939-6319",
            email: "threestars039@gmail.com",
        },
        broker: {
            name: load.broker?.name || "N/A",
            address: load.broker?.address_1 || "",
            address2: load.broker?.address_2 || "",
            phone: load.broker?.phone || "",
            email: load.broker?.email || "",
        },
        adjustments: {
            quickpayFeePercent: load.payment_terms?.fee_percent || 0,
            fixedFee: 0,
        },
        items: [{
            description: "Line Haul",
            notes: `Truck# ${load.truck?.truck_number || ""}, Trailer# ${load.equipment?.equipment_number || ""}`,
            quantity: 1,
            cost: Number(load.rate) || 0,
            stops: load.stops
                ?.filter((s) => ["pickup", "delivery"].includes(s.type.toLowerCase()))
                .map((s, idx) => ({
                    type: (idx + 1) + ".- " + s.type.charAt(0).toUpperCase() + s.type.slice(1),
                    city: s.location.split(",")[0],
                    zip: s.location.split(" ").slice(-1)[0] || "",
                    datetime: s.window_start || "",
                })),
        }] || [],
        color: "134A9E",
        secondaryColor: "134A9E",
    }
}
const handleGenerateInvoice = async (data) => {
    if (!data) return

    const payload = mapLoadToInvoicePayload(data)

    await toast.promise(
        (async () => {
            const res = await fetch("https://invoice4all.vercel.app/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error("Failed to generate invoice")

            // Get the PDF as a blob
            const blob = await res.blob()
            const url = window.URL.createObjectURL(blob)

            // Open PDF in new tab
            const link = document.createElement("a")
            link.href = url
            link.download = `invoice-${payload.id}.pdf`
            link.target = "_blank"
            link.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
        })(),
        {
            loading: "Generating invoice...",
            success: "Invoice generated!",
            error: (err) => err.message || "Failed to generate invoice",
        }
    )
}


// 🔹 Component
export default function LoadProgressCard({ data }) {
    const detailedSteps = buildDetailedSteps(data.stops)
    const uiSteps = buildVisibleSteps(data.stops)

    const [progress, setProgress] = useState(data.progress) // detailed step index

    const uiIndex = mapProgressToUI(progress, data.stops)
    const progressValue = (uiIndex / (uiSteps.length - 1)) * 100

    function getLoadStatus(progress, totalSteps) {
        if (progress === 0) return "new";
        if (progress === 1) return "at_pickup";
        if (progress === 2) return "in_transit";
        if (progress === totalSteps - 3) return "delivered";
        if (progress === totalSteps - 2) return "invoiced";
        if (progress === totalSteps - 1) return "paid";
        return "in_transit"; // default
    }
    async function handleNext() {
        if (progress < detailedSteps.length - 1) {
            const newProgress = progress + 1;
            const newStatus = getLoadStatus(newProgress, detailedSteps.length);
            setProgress(newProgress);

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/update/loads/${data.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ progress: newProgress, load_status: newStatus }),
                });

                if (!res.ok) throw new Error("Failed to update progress");
            } catch (error) {
                console.error(error);
            }
        }
    }

    async function handlePrev() {
        if (progress > 0) {
            const newProgress = progress - 1;
            const newStatus = getLoadStatus(newProgress, detailedSteps.length);
            setProgress(newProgress);

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/update/loads/${data.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ progress: newProgress, load_status: newStatus }),
                });

                if (!res.ok) throw new Error("Failed to update progress");
            } catch (error) {
                console.error(error);
            }
        }
    }

    const visibleLabels = getVisibleStepLabels(progress, data.stops)
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Load Progress
                        <Badge status={`${getLoadStatus(progress, detailedSteps.length)}`}>
                            {detailedSteps[progress]}
                        </Badge>
                    </div>
                    <div className="flex gap-2">

                        <Button variant={"outline"} onClick={handlePrev} disabled={progress === 0}>
                            <ChevronLeft />
                        </Button>



                        {progress === detailedSteps.length - 3 && (
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="outline">Send Invoice</Button>
                                </SheetTrigger>

                                <SheetContent side="right" className="flex flex-col h-full">
                                    <div className="mx-auto w-full max-w-sm flex-1 overflow-auto">
                                        <SheetHeader>
                                            <SheetTitle>Send Invoice</SheetTitle>
                                            <p className="text-sm text-muted-foreground">
                                                Sending email to broker about invoice.
                                            </p>
                                        </SheetHeader>

                                        <div className="p-4 space-y-4">
                                            {/* Broker & Invoice Info */}
                                            <div>
                                                <p><strong>Broker:</strong> {data.broker.name}</p>
                                                <p><strong>Load #:</strong> {data.load_number}</p>
                                                <p><strong>Amount:</strong> {data.rate}</p>
                                            </div>

                                            {/* Invoice preview / file info */}
                                            <div>
                                                <p><strong>Invoice:</strong> {data.invoice_number}.pdf</p>
                                            </div>
                                        </div>
                                    </div>

                                    <SheetFooter className="p-4 border-t flex flex-col gap-2">
                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                handleNext()
                                            }}
                                        >
                                            Send Invoice to Broker
                                        </Button>

                                        <Button
                                            className="w-full"
                                            onClick={() => {
                                                handleNext()
                                                handleGenerateInvoice(data)
                                            }}
                                        >
                                            Mark as Invoiced & Download
                                        </Button>

                                        <Button variant="outline" className="w-full">
                                            Cancel
                                        </Button>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                        )}
                        {progress === detailedSteps.length - 2 && <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline">Record Payment</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This is the last step, are you sure you want to record payment?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>No, Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleNext}>Yes, Payment Received</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>}
                        {progress <= detailedSteps.length - 4 && <Button variant={"outline"} onClick={handleNext}>
                            <ChevronRight />
                        </Button>
                        }
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* Labels */}


                    <div className="flex justify-between text-sm font-medium">
                        {visibleLabels.map((step, i) => (
                            <span
                                key={i}
                                className={`flex-1 text-center ${i === 0
                                    ? "text-left"
                                    : i === visibleLabels.length - 1
                                        ? "text-right"
                                        : "text-center"
                                    }`}
                            >
                                {step}
                            </span>
                        ))}
                    </div>


                    {/* Progress Bar */}
                    <Progress value={progressValue} className="h-3" />

                    <p className="text-sm text-muted-foreground">
                        Current step: {detailedSteps[progress]}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
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
                const API_BASE = process.env.NEXT_PUBLIC_API_BASE
                const res = await fetch(`${API_BASE}/get/loads/${id}`, {
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
                setProgress(data.progress || 0)
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
                                ${(Number.parseFloat(data.rate) - data.rate * (data.payment_terms.fee_percent / 100)).toFixed(2)}
                            </span>
                            <span className="text-xl font-medium text-blue-400">
                                {formatDueDate(data.invoiced_at, data.payment_terms.days_to_pay)}
                            </span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Base Rate:</span>
                                <span className="text-xs font-medium">${data.rate}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Quick Pay ({data.payment_terms.fee_percent}%):</span>
                                <span className="text-xs font-medium text-red-500">
                                    -${(Number.parseFloat(data.rate) * data.payment_terms.fee_percent / 100).toFixed(2)}
                                </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium">Total:</span>
                                <span className="text-xs font-bold text-green-500">
                                    ${(Number.parseFloat(data.rate) - data.rate * (data.payment_terms.fee_percent / 100)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Payment Terms:</span>
                                <span className="text-xs font-medium">
                                    {data.payment_terms.name}
                                </span>

                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="w-full h-10">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="parties">Parties</TabsTrigger>
                    <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4">
                    {/* Progress Bar */}
                    <LoadProgressCard data={data} />

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
                                <CardTitle className="flex items-center gap-2">
                                    <NotepadText className="h-5 w-5" />
                                    Special Intructions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Textarea
                                    value={data.instructions || ""}
                                    readOnly
                                    placeholder="Notes..."
                                    rows={6}
                                    disabled={loading}
                                />
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
                </TabsContent>
                {/* Parties Info */}
                <TabsContent value="parties" className="flex flex-col md:grid md:grid-cols-2 md:gap-4 gap-4">
                    <Card >
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Broker Information
                                </div>
                                <div>
                                    <Button asChild >

                                        <Link href={`/brokers/${data.broker.id}`} >
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
                                <p className="text-sm font-semibold">{data.broker.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Address</p>
                                <p className="text-sm">{data.broker.address_1}</p>
                                {data.broker.address_2 && <p className="text-sm">{data.broker.address_2}</p>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Broker Agent</p>
                                {data.agent_name ? (
                                    <Link href={`/brokers/${data.broker.id}/angents/${data.agent.id}`} className="underline">
                                        <p className="text-sm font-semibold">{data.agent.name}</p>
                                    </Link>
                                ) : (
                                    <p className="text-sm font-semibold text-gray-500">N/A</p>
                                )}

                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Equipment
                                </div>

                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Truck</p>
                                <Link href={data.truck.id ? `/trucks/${data.truck.id}` : "#"} className={data.truck.id ? "underline" : "text-gray-500"}>
                                    <p className="text-sm font-semibold">{data.truck.truck_number}</p>
                                </Link>

                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Trailer</p>
                                <Link href={data.equipment.id ? `/equipment/${data.equipment.id}` : "#"} className={data.equipment.id ? "underline" : "text-gray-500"}>
                                    <p className="text-sm font-semibold">{data.equipment.equipment_number}</p>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="documents" className="space-y-4">
                    <DocumentsCard load={data} setTruckData={setData} />
                </TabsContent>
            </Tabs>

        </div>
    )
}
