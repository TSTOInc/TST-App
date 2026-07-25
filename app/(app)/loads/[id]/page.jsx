"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatCentsToUSD, calculateLoadFinancials } from "@/lib/currency"

// Design Layout Components
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Application Shared Elements
import TimelineVertical from "@/components/TimelineVertical"
import TruckRouteMap from "@/components/custom/TruckRouteMap"
import InfoCard from '@/components/data/info-card'
import LoadProgressCard from '@/components/layout/LoadProgressCard'
import { DialogDemo } from "@/components/data/upload/upload-doc"
import { DocumentCard } from "@/components/documents/document-card"
import { AuditLogItem } from "@/components/data/log/log-item"

// Icon Packs
import {
  FileText, DollarSign, Package, Building2, NotepadText, MapPin,
  ArrowUpFromLine, ArrowDownToLine, FileSearch, FileTextIcon, Unplug,
  ActivityIcon, Plus, Trash2, Loader2, RefreshCw, Eye, Download,
  MinusCircleIcon,
  PlusCircleIcon
} from "lucide-react"
import { IconFileDollar } from "@tabler/icons-react"

// ----------------------------------------------------------------------
// Constants & Pure Transform Helpers (Isolated from React Cycles)
// ----------------------------------------------------------------------

const INVOICE_DOCUMENT_CATEGORIES = [
  { value: "RATE_CONFIRMATION", label: "Rate Confirmation" },
  { value: "BOL", label: "Bill of Lading" },
  { value: "POD", label: "Proof of Delivery" },
  { value: "INNOUT_TICKET", label: "In/Out Ticket" },
  { value: "LUMPER", label: "Lumper Ticket" },
  { value: "SCALE_TICKET", label: "Scale Ticket" },
  { value: "TRAILER_INTERCHANGE", label: "Trailer Interchange" },
  { value: "MISC", label: "Other" },
];

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    })
    : "N/A";

const formatTimeRange = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const startDateStr = s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const endDateStr = e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const startTime = s.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const endTime = e.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return startDateStr === endDateStr
    ? `${startDateStr}, ${startTime} - ${endTime}`
    : `${startDateStr}, ${startTime} - ${endDateStr}, ${endTime}`;
};

const getDueDateStatus = (invoiceDateStr, daysToPay, paid_at) => {
  if (!invoiceDateStr || typeof daysToPay !== "number") {
    return { text: "IN PROGRESS", color: "text-muted-foreground" };
  }
  const invoiceDate = new Date(invoiceDateStr);
  if (isNaN(invoiceDate)) return { text: "", color: "text-muted-foreground" };

  const dueDate = new Date(invoiceDate);
  dueDate.setDate(invoiceDate.getDate() + daysToPay);

  const diffDays = Math.ceil((dueDate.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));

  if (paid_at !== undefined && paid_at !== null) return { text: "PAID", color: "text-green-500" };
  if (diffDays < 0) return { text: `OVERDUE BY ${Math.abs(diffDays)} DAY${Math.abs(diffDays) !== 1 ? "S" : ""}`, color: "text-rose-500 font-semibold" };
  if (diffDays === 0) return { text: "DUE TODAY", color: "text-amber-500 font-medium" };
  return { text: `DUE IN ${diffDays} DAY${diffDays !== 1 ? "S" : ""}`, color: "text-blue-400" };
};

const geocodeAddress = async (address) => {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error("Missing Mapbox Access Token");

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${token}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding network request error");

  const data = await res.json();
  if (data?.features?.length > 0) return data.features[0].geometry.coordinates;
  throw new Error(`Could not geocode target string location: ${address}`);
};

function mapLoadToInvoicePayload(load, liveAdjustments = []) {
  const targetAdjustments = liveAdjustments.map(adj => ({
    id: adj.id || crypto.randomUUID(),
    description: adj.description,
    type: adj.type,
    amountCents: adj.amountCents
  }));

  const targetStops = (load.stops || [])
    .filter((s) => ["pickup", "delivery"].includes(s.type.toLowerCase()))
    .map((s) => {
      const fullLocationString = (s.location || "").trim();
      let displayCity = fullLocationString;
      let extractedState = "";
      let extractedZip = "";

      const zipRegex = /([^,]+),\s*([A-Z]{2})\s+(\d{5})$/;
      const match = fullLocationString.match(zipRegex);

      if (match) {
        displayCity = match[1].trim();
        extractedState = match[2];
        extractedZip = match[3];
      }

      return {
        type: s.type.charAt(0).toUpperCase() + s.type.slice(1),
        city: displayCity,
        state: extractedState,
        zip: extractedZip,
        datetime: s.appointment_time || s.window_start || "",
        datetime2: s.window_end || "",
      };
    });

  return {
    id: String(load.invoice_number || load._id || ""),
    load_number: load.load_number || "",
    load_number_label: "Shipment",
    date: load.invoiced_at || load._creationTime || new Date().toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    carrier: {
      name: load.carrier?.name || "",
      address: load.carrier?.address || "",
      address2: `${load.carrier?.city || ""}, ${load.carrier?.state || ""} ${load.carrier?.zip || ""}`.trim(),
      phone: load.carrier?.phone || "",
      email: load.carrier?.company_email || "",
    },
    broker: {
      name: load.broker?.name || "N/A",
      address: load.broker?.address || "",
      address2: `${load.broker?.city || ""}, ${load.broker?.state || ""} ${load.broker?.zip || ""}`.trim(),
      phone: load.broker?.phone || "",
      email: load.broker?.email || "",
    },
    adjustments: targetAdjustments,
    items: [
      {
        description: "Line Haul",
        notes: `Truck# ${load.truck?.truck_number || ""}, Trailer# ${load.equipment?.equipment_number || ""}`,
        quantity: 1,
        cost: load.rate ? Number(load.rate) / 100 : 0,
        stops: targetStops
      }
    ],
    color: "134A9E",
    secondaryColor: "134A9E",
  };
}

// ---------------------- MEMOIZED SUB-COMPONENTS ----------------------

const ComplexCard = React.memo(({ title, icon: Icon, value }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
));
ComplexCard.displayName = "ComplexCard";

const RateCard = React.memo(({ rate, feePercent, invoicedAt, paymentTerms, paid_at, adjustments = [] }) => {
  const financials = useMemo(() => calculateLoadFinancials(rate, feePercent, adjustments), [rate, feePercent, adjustments]);
  const status = useMemo(() => getDueDateStatus(invoicedAt, paymentTerms?.days_to_pay, paid_at), [invoicedAt, paymentTerms?.days_to_pay, paid_at]);

  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Rate Details</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-green-500">{formatCentsToUSD(financials.netRateCents)}</span>
          <span className={cn("text-xl font-medium", status.color)}>{status.text}</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Base Rate:</span>
            <span className="text-xs font-medium">{formatCentsToUSD(financials.baseRateCents)}</span>
          </div>
          {financials.totalAdditionsCents > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Adjustments (Additions):</span>
              <span className="text-xs font-medium text-green-500">+{formatCentsToUSD(financials.totalAdditionsCents)}</span>
            </div>
          )}
          {financials.totalDeductionsCents > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Adjustments (Deductions):</span>
              <span className="text-xs font-medium text-red-500">-{formatCentsToUSD(financials.totalDeductionsCents)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Quick Pay ({feePercent}%):</span>
            <span className="text-xs font-medium text-red-500">-{formatCentsToUSD(financials.quickPayFeeCents)}</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Net Payout:</span>
            <span className="text-xs font-bold text-green-500">{formatCentsToUSD(financials.netRateCents)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Payment Terms:</span>
            <span className="text-xs font-medium">{paymentTerms?.name || "N/A"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
RateCard.displayName = "RateCard";

const DocumentsCard = React.memo(({ load, files }) => {
  const filteredFiles = useMemo(() => files?.filter((file) => file.category !== "CDL") || [], [files]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Load Documents</CardTitle>
        <DialogDemo
          title="Add Document"
          categories={INVOICE_DOCUMENT_CATEGORIES}
          multiple={true}
          perFile={true}
          category="MISC"
          entityType="loads"
          entityId={load._id}
          expires={false}
        />
      </CardHeader>
      <CardContent className="space-y-2">
        {!filteredFiles.length ? (
          <p className="text-neutral-500 italic text-sm">
            No documents found for load <span className="font-bold">{load.load_number}</span>. Click "Add Document" to upload files related to this load.
          </p>
        ) : (
          <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 px-4">
            {filteredFiles.map((file) => <DocumentCard key={file._id} file={file} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
DocumentsCard.displayName = "DocumentsCard";

// ---------------------- INVOICE TAB CONTENT ----------------------
const InvoiceTabContent = React.memo(({ loadData, carrierData }) => {
  const [adjustments, setAdjustments] = useState(loadData.adjustments || []);
  const [adjDescription, setAdjDescription] = useState("");
  const [adjAmount, setAdjAmount] = useState("");

  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const updateAdjustmentsMutation = useMutation(api.loads.updateAdjustments);

  useEffect(() => {
    if (loadData.adjustments) setAdjustments(loadData.adjustments);
  }, [loadData.adjustments]);

  // Clean up object URLs *only* when a new one replaces it or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Debounced API compilation loop
  useEffect(() => {
    let active = true;

    const fetchInvoiceBlob = async () => {
      setIsPreviewLoading(true);
      try {
        const payload = mapLoadToInvoicePayload({ ...loadData, carrier: carrierData }, adjustments);
        const res = await fetch("https://invoice4all.vercel.app/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_INVOICE4ALL_API_KEY || "",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Compilation failed");

        const blob = await res.blob();
        if (active) {
          const url = window.URL.createObjectURL(blob);
          setPreviewUrl((prev) => {
            if (prev) window.URL.revokeObjectURL(prev); // Clean up the immediate previous version
            return url;
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Could not update invoice preview.");
      } finally {
        if (active) setIsPreviewLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchInvoiceBlob();
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [adjustments, loadData, carrierData]);

  const syncAdjustmentsToDatabase = useCallback(async (updatedList) => {
    setIsSaving(true);
    try {
      await updateAdjustmentsMutation({ id: loadData._id, adjustments: updatedList });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save adjustments. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }, [loadData._id, updateAdjustmentsMutation]);

  const handleAddAdjustment = async (type) => {
    if (!adjDescription || !adjAmount) return;

    const amountInCents = Math.round(parseFloat(adjAmount) * 100);
    const newAdj = {
      id: crypto.randomUUID(),
      description: adjDescription,
      type,
      amountCents: amountInCents
    };

    const targetList = [...adjustments, newAdj];

    setAdjustments(targetList);
    setAdjDescription("");
    setAdjAmount("");

    await syncAdjustmentsToDatabase(targetList);
  };

  const handleRemoveAdjustment = useCallback(async (id) => {
    const targetList = adjustments.filter(a => a.id !== id);
    setAdjustments(targetList);
    await syncAdjustmentsToDatabase(targetList);
  }, [adjustments, syncAdjustmentsToDatabase]);

  const handleDownloadInvoice = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `Invoice-${loadData?.invoice_number || "export"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [previewUrl, loadData?.invoice_number]);

  return (
    <div className="grid gap-6 lg:grid-cols-3 items-start p-1">
      {/* LEFT COLUMN: CONTROLS */}
      <div className="space-y-4 lg:col-span-1">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add Extra Charges / Discounts
            </CardTitle>
            <CardDescription>Include accessorials like detention, lumper, or advance fines.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Detention at receiver, Lumper fee"
                value={adjDescription}
                onChange={(e) => setAdjDescription(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (USD)</Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            {/* Multi-action submit area eliminates dropdown clutter */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "text-xs font-medium h-9 gap-1.5 transition-colors",
                  "border-green-200 bg-green-50/30 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300",
                  "dark:border-green-900/40 dark:bg-green-950/10 dark:text-green-400 dark:hover:bg-green-950/30"
                )}
                disabled={isSaving || !adjDescription || !adjAmount}
                onClick={() => handleAddAdjustment("addition")}
              >
                <PlusCircleIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Add Charge</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className={cn(
                  "text-xs font-medium h-9 gap-1.5 transition-colors",
                  "border-red-200 bg-red-50/30 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300",
                  "dark:border-red-900/40 dark:bg-red-950/10 dark:text-red-400 dark:hover:bg-red-950/30"
                )}
                disabled={isSaving || !adjDescription || !adjAmount}
                onClick={() => handleAddAdjustment("deduction")}
              >
                <MinusCircleIcon className="h-3.5 w-3.5 shrink-0" />
                <span>Deduct Amount</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* APPLIED ITEMS */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Applied Items ({adjustments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {adjustments.length === 0 ? (
              <div className="text-center py-6 border border-dashed rounded-lg border-muted bg-muted/20">
                <p className="text-xs text-muted-foreground">No extra items added yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto pr-1">
                {adjustments.map((adj) => (
                  <div key={adj.id} className="flex justify-between items-center py-2.5 text-xs group">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-medium truncate">{adj.description}</span>
                      <span className="text-[10px] text-muted-foreground capitalize">{adj.type}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "font-semibold",
                        adj.type === 'addition' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {adj.type === 'addition' ? '+' : '-'}{formatCentsToUSD(adj.amountCents)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground opacity-80 hover:opacity-100 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRemoveAdjustment(adj.id)}
                        disabled={isSaving}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: LIVE PREVIEW */}
      <div className="lg:col-span-2 flex flex-col space-y-2 h-[calc(100vh-140px)]">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Eye className="w-4 h-4 text-muted-foreground" /> Invoice Preview
            {/* Seamless, micro-copy state indicator */}
            {(isPreviewLoading || isSaving) && (
              <span className="text-xs font-normal text-muted-foreground flex items-center gap-1 ml-2 bg-muted px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-primary" /> Updating...
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="text-xs h-8 gap-1.5 font-medium shadow-sm"
            disabled={!previewUrl}
            onClick={handleDownloadInvoice}
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </div>

        <Card className="flex-1 w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900 border border-border shadow-inner relative rounded-xl flex items-center justify-center">
          {previewUrl ? (
            <iframe
              src={`${previewUrl}#toolbar=0&navpanes=0&view=FitH`}
              className={cn(
                "w-full h-full block bg-white transition-opacity duration-150",
                isPreviewLoading || isSaving ? "opacity-60 pointer-events-none" : "opacity-100"
              )}
            />
          ) : (
            <div className="text-center space-y-3 p-6 max-w-sm">
              <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              <p className="text-xs text-muted-foreground font-medium">Generating your invoice document...</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
});
InvoiceTabContent.displayName = "InvoiceTabContent";

// ---------------------- MAIN PAGE CONTAINER ----------------------
export default function HomePage({ params }) {
  const { id } = React.use(params);

  //Check auth via clerk before querying from convex
  const { isLoaded, isSignedIn } = useAuth();
  const shouldQuery = isLoaded && isSignedIn;

  const carrier = useQuery(api.auth.getUserWithOrg, shouldQuery ? {} : "skip");
  const data = useQuery(api.loads.byId, shouldQuery && id ? { id } : "skip");

  const files = useQuery(
    api.files.byId,
    shouldQuery && id ? { entityType: "loads", entityId: id } : "skip"
  );

  const logs = useQuery(
    api.logs.byId,
    shouldQuery && id ? { table: "loads", id: id } : "skip"
  );

  const [stopsWithCoords, setStopsWithCoords] = useState([]);

  const sortedStops = useMemo(() => {
    if (!data?.stops) return [];
    return [...data.stops].sort((a, b) => {
      const timeA = a.appointment_time ? new Date(a.appointment_time) : new Date(a.window_end);
      const timeB = b.appointment_time ? new Date(b.appointment_time) : new Date(b.window_end);
      return timeA - timeB;
    });
  }, [data?.stops]);

  const timelineStops = useMemo(() => {
    return sortedStops.map((stop, index) => ({
      id: index + 1,
      title: stop.type === "pickup" ? "Pickup" : stop.type === "delivery" ? "Delivery" : "Stop",
      description: stop.location,
      date: stop.appointment_time ? formatDate(stop.appointment_time) : formatTimeRange(stop.window_start, stop.window_end),
      icon: stop.type === "pickup" ? ArrowUpFromLine : stop.type === "delivery" ? ArrowDownToLine : MapPin,
    }));
  }, [sortedStops]);

  // Safe Geocoding effect pattern utilizing active closure boundaries to catch asynchronous edge cases
  useEffect(() => {
    if (!sortedStops.length) return;
    let active = true;

    const fetchStops = async () => {
      try {
        const stopsWithCoordinates = await Promise.all(
          sortedStops.map(async (stop) => {
            const coords = await geocodeAddress(stop.location);
            return {
              ...stop,
              coordinates: coords,
              lat: coords[1],
              lng: coords[0],
              type: stop.type.charAt(0).toUpperCase() + stop.type.slice(1),
            };
          })
        );
        if (active) setStopsWithCoords(stopsWithCoordinates);
      } catch (err) {
        console.error("Failed route mapping resolution:", err);
      }
    };

    fetchStops();
    return () => { active = false; };
  }, [sortedStops]);

  if (!isLoaded || !carrier || !data) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-1">
          <ComplexCard title="Load Number" icon={FileText} value={`#${data.load_number}`} />
          <ComplexCard title="Invoice Number" icon={DollarSign} value={`#${data.invoice_number}`} />
        </div>
        <RateCard
          rate={Number.parseFloat(data.rate || "0")}
          feePercent={data.payment_terms?.fee_percent || 0}
          invoicedAt={data.invoiced_at}
          paymentTerms={data.payment_terms}
          paid_at={data.paid_at}
          adjustments={data.adjustments || []}
        />
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full h-10 grid grid-cols-5 bg-muted/60">
          <TabsTrigger value="details" className="flex items-center gap-1.5"><FileSearch className="h-4 w-4" />Details</TabsTrigger>
          <TabsTrigger value="parties" className="flex items-center gap-1.5"><Unplug className="h-4 w-4" />Parties</TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-1.5"><FileTextIcon className="h-4 w-4" />Documents</TabsTrigger>
          <TabsTrigger value="invoice" className="flex items-center gap-1.5"><IconFileDollar className="h-4 w-4" />Invoice</TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-1.5"><ActivityIcon className="h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4 mt-4">
          <LoadProgressCard data={data} carrier={carrier?.org} />
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              CardIcon={<Package className="h-5 w-5" />}
              editable={{ tableName: "loads", id: data._id }}
              title="Load Information"
              inline={false}
              fields={[
                { label: "COMMODITY", value: data.commodity, key: "commodity" }, // Added key
                { label: "LOAD TYPE", value: data.load_type, key: "load_type", type: "select", options: [{ value: "FTL", label: "FTL" }, { value: "LTL", label: "LTL" }] }, // Added key
                { label: "LENGTH FT", value: data.length_ft, key: "length_ft" }, // Added key
                { label: "CREATED AT", value: data._creationTime, type: "date" }, // No key = Read-only even in edit mode
              ]}
            />
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base font-semibold"><NotepadText className="h-5 w-5" /> Special Instructions</CardTitle></CardHeader>
              <CardContent><Textarea value={data.instructions || ""} readOnly rows={6} className="resize-none bg-muted/30 focus-visible:ring-0" placeholder="No manual entry notes." /></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2 text-base font-semibold"><MapPin className="h-5 w-5" /> Route Information</CardTitle></CardHeader>
              <CardContent><TimelineVertical items={timelineStops} /></CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <MapPin className="h-5 w-5" /> Route Map
                  <span className="text-xs text-muted-foreground font-normal ml-1">({Math.max(0, (data.progress - 1) / 2)}/{stopsWithCoords.length} stops)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stopsWithCoords.length > 0 ? (
                  <TruckRouteMap stops={stopsWithCoords} progress={(data.progress - 1) / 2} />
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-center p-4">
                    <MapPin className="h-8 w-8 text-muted-foreground animate-bounce mb-2" />
                    <p className="text-xs text-muted-foreground">Resolving visual GPS telemetry coordinates...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              CardIcon={<Building2 className="h-5 w-5" />}
              title="Broker Information"
              inline={false}
              editable={{
                tableName: "loads", // Replace with your parent collection table name
                id: data._id
              }}
              fields={[
                {
                  label: "Name",
                  key: "broker_id",
                  value: data.broker?._id,
                  type: "reference",
                  href: `/brokers/${data.broker?._id}`,
                  referenceTable: "brokers",
                  external: false
                },
                {
                  label: "Address",
                  // Read-only formats the full address block string; 
                  // Edit mode drops back to a simple, direct text string value modifier
                  value: data.broker ? `${data.broker.address}, ${data.broker.city}, ${data.broker.state} ${data.broker.zip}` : "N/A"
                  // Note: If you want to update address subfields directly from here, 
                  // they should be updated on a dedicated broker management view since this table tracks parent records (like loads)
                },
                {
                  label: "Agent",
                  key: "broker_agent_id",
                  value: data.broker_agent?._id,
                  type: "reference",
                  href: `/broker_agents/${data.broker_agent?._id}`,
                  referenceTable: "broker_agents",
                  external: false
                },
              ]}
            />
            <InfoCard
              CardIcon={<Package className="h-5 w-5" />}
              title="Equipment Information"
              inline={false}
              editable={{
                tableName: "loads",
                id: data._id
              }}
              fields={[
                {
                  label: "Truck",
                  key: "truck_id",
                  value: data.truck?._id,
                  type: "reference",
                  href: `/trucks/${data.truck?._id}`,
                  referenceTable: "trucks",
                  external: false
                },
                {
                  label: "Equipment",
                  key: "equipment_id",
                  value: data.equipment?._id,
                  type: "reference",
                  href: `/equipment/${data.equipment?._id}`,
                  referenceTable: "equipment",
                  external: false
                },
              ]}
            />
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4 mt-4">
          <DocumentsCard load={data} files={files || []} />
        </TabsContent>

        <TabsContent value="invoice" className="space-y-4 mt-4">
          <InvoiceTabContent loadData={data} carrierData={carrier?.org} />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Load Logs</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {logs?.length ? (
                logs.map((log, i) => <AuditLogItem key={log._id || i} log={log} />)
              ) : (
                <p className="text-xs text-muted-foreground italic">No historical log footprints saved.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}