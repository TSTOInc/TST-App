import React, { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Route,
    ChevronRight,
    ChevronLeft,
    Upload as IconUpload,
    Trash as IconTrash,
    Loader2 as IconLoader2
} from "lucide-react"
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
import { send } from "@/lib/email"
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";


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

const handleSendEmail = async (load) => {
    await toast.promise(
        (async () => {
            await send(load);
        })(),
        {
            loading: "Sending email...",
            success: "Email sent!",
            error: (err) => err.message || "Failed to send email",
        }
    );
};

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


export default function LoadProgressCard({ data }) {

    const updateProgress = useMutation(api.loads.updateProgress);

    const sortedStops = [...(data.stops || [])].sort((a, b) => {
        const timeA = a.appointment_time
            ? new Date(a.appointment_time)
            : new Date(a.window_end);
        const timeB = b.appointment_time
            ? new Date(b.appointment_time)
            : new Date(b.window_end);
        return timeA - timeB;
    });

    const detailedSteps = buildDetailedSteps(sortedStops);
    const uiSteps = buildVisibleSteps(sortedStops);

    const [progress, setProgress] = useState(data.progress); // detailed step index

    const uiIndex = mapProgressToUI(progress, sortedStops);
    const progressValue = (uiIndex / (uiSteps.length - 1)) * 100;

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
                await updateProgress({
                    loadId: data._id,
                    progress: newProgress,
                    load_status: newStatus,
                });
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
                await updateProgress({
                    loadId: data._id,
                    progress: newProgress,
                    load_status: newStatus,
                });
            } catch (error) {
                console.error(error);
            }
        }
    }

    const visibleLabels = getVisibleStepLabels(progress, sortedStops)
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
                                                <p><strong>Email:</strong> {data.payment_terms.email}</p>
                                                <p><strong>Load #:</strong> {data.load_number}</p>
                                                <p>
                                                    <strong>Amount:</strong>{" "}
                                                    {data.payment_terms.is_quickpay ? (() => {
                                                        // Calculate amount, discount, and final amount
                                                        const amountDue = data.rate ? `$${parseFloat(data.rate).toFixed(2)}` : "$0.00";
                                                        const amount = parseFloat(data.rate) || 0;
                                                        const discount = amount * ((data.payment_terms?.fee_percent || 0) / 100);
                                                        const finalAmount = amount - discount;
                                                        return `${amountDue} - $${discount.toFixed(2)} = $${finalAmount.toFixed(2)}`;
                                                    })()
                                                        : data.rate}
                                                </p>
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
                                                handleSendEmail(data)
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