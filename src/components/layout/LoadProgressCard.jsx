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
                    address: s.location.split(",")[0]?.trim() || "",
                    city: s.location.split(",")[1]?.trim() || "",
                    state: s.location.split(",")[2]?.trim().split(" ")[0] || "",
                    zip: s.location.split(",")[2]?.trim().split(" ")[1] || "",
                    datetime: s.appointment_time || s.window_start || "",
                    datetime2: s.window_end || "",
                })),
        }] || [],
        color: "134A9E",
        secondaryColor: "134A9E",
    }
}
const handleGenerateInvoice = async (data, setInvoicedAt) => {
    if (!data) return

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

    const invoiceDate = data.invoiced_at && data.invoiced_at !== ""
        ? data.invoiced_at
        : new Date().toISOString()

    const payload = mapLoadToInvoicePayload({
        ...data,
        invoiced_at: invoiceDate, // force sync
    })
    payload.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

    await toast.promise(
        (async () => {
            if (!data.invoiced_at || data.invoiced_at === "") {
                await setInvoicedAt({ loadId: data._id, invoiced_at: invoiceDate })
            }


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
  const setInvoicedAt = useMutation(api.loads.setInvoicedAt);
  const setPaidAt = useMutation(api.loads.setPaidAt);
  const clearPaidAt = useMutation(api.loads.clearPaidAt);

  const [progress, setProgress] = useState(data.progress);
  const [showUndoPaid, setShowUndoPaid] = useState(false);

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

  const uiIndex = mapProgressToUI(progress, sortedStops);
  const progressValue = (uiIndex / (uiSteps.length - 1)) * 100;

  function getLoadStatus(progress, totalSteps) {
    if (progress === 0) return "new";
    if (progress === 1) return "at_pickup";
    if (progress === 2) return "in_transit";
    if (progress === totalSteps - 3) return "delivered";
    if (progress === totalSteps - 2) return "invoiced";
    if (progress === totalSteps - 1) return "paid";
    return "in_transit";
  }

  async function handleNext() {
    if (progress < detailedSteps.length - 1) {
      const newProgress = progress + 1;
      const newStatus = getLoadStatus(newProgress, detailedSteps.length);

      setProgress(newProgress);

      await updateProgress({
        loadId: data._id,
        progress: newProgress,
        load_status: newStatus,
      });
    }
  }

  async function handlePrev() {
    // If currently PAID → confirm undo
    if (progress === detailedSteps.length - 1) {
      setShowUndoPaid(true);
      return;
    }

    if (progress > 0) {
      const newProgress = progress - 1;
      const newStatus = getLoadStatus(newProgress, detailedSteps.length);

      setProgress(newProgress);

      await updateProgress({
        loadId: data._id,
        progress: newProgress,
        load_status: newStatus,
      });
    }
  }

  const visibleLabels = getVisibleStepLabels(progress, sortedStops);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Load Progress
              <Badge status={getLoadStatus(progress, detailedSteps.length)}>
                {detailedSteps[progress]}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrev}
                disabled={progress === 0}
              >
                <ChevronLeft />
              </Button>

              {/* SEND INVOICE */}
              {progress === detailedSteps.length - 3 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline">Send Invoice</Button>
                  </SheetTrigger>

                  <SheetContent side="right" className="flex flex-col h-full">
                    <div className="mx-auto w-full max-w-sm flex-1 overflow-auto">
                      <SheetHeader>
                        <SheetTitle>Send Invoice</SheetTitle>
                      </SheetHeader>

                      <div className="p-4 space-y-4">
                        <p><strong>Broker:</strong> {data.broker.name}</p>
                        <p><strong>Email:</strong> {data.payment_terms.email}</p>
                        <p><strong>Load #:</strong> {data.load_number}</p>
                        <p><strong>Invoice:</strong> {data.invoice_number}.pdf</p>
                      </div>
                    </div>

                    <SheetFooter className="p-4 border-t flex flex-col gap-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          handleSendEmail(data);
                          handleNext();
                        }}
                      >
                        Send Invoice to Broker
                      </Button>

                      <Button
                        className="w-full"
                        onClick={() => {
                          handleGenerateInvoice(data, setInvoicedAt);
                          handleNext();
                        }}
                      >
                        Mark as Invoiced & Download
                      </Button>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              )}

              {/* RECORD PAYMENT */}
              {progress === detailedSteps.length - 2 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">Record Payment</Button>
                  </AlertDialogTrigger>

                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the load as paid.
                      </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const paidAt = new Date().toISOString();

                          await setPaidAt({
                            loadId: data._id,
                            paid_at: paidAt,
                          });

                          await handleNext();
                        }}
                      >
                        Payment Received
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}

              {progress <= detailedSteps.length - 4 && (
                <Button variant="outline" onClick={handleNext}>
                  <ChevronRight />
                </Button>
              )}
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              {visibleLabels.map((step, i) => (
                <span key={i} className="flex-1 text-center">
                  {step}
                </span>
              ))}
            </div>

            <Progress value={progressValue} className="h-3" />

            <p className="text-sm text-muted-foreground">
              Current step: {detailedSteps[progress]}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* UNDO PAID MODAL */}
      <AlertDialog open={showUndoPaid} onOpenChange={setShowUndoPaid}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo Payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the payment date and move the load back to
              invoiced.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const newProgress = progress - 1;
                const newStatus = getLoadStatus(
                  newProgress,
                  detailedSteps.length
                );

                await clearPaidAt({ loadId: data._id });

                await updateProgress({
                  loadId: data._id,
                  progress: newProgress,
                  load_status: newStatus,
                });

                setProgress(newProgress);
                setShowUndoPaid(false);
              }}
            >
              Yes, Undo Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}