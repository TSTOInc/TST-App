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
  PlusCircleIcon,
  CalendarIcon,
  CreditCardIcon,
  CalculatorIcon,
  CheckCircle2Icon,
  PencilIcon,
  XIcon,
  CheckIcon
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


// Helper function to format any incoming date into YYYY-MM-DD required by <input type="date" />
const formatDateForInput = (dateVal) => {
  if (!dateVal) return "";
  if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
    return dateVal;
  }
  try {
    const dateObj = new Date(dateVal);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  } catch (e) {
    return "";
  }
};


export const InvoiceTabContent = React.memo(({ loadData, carrierData }) => {
  // --- MAIN FORM STATES ---
  const [invoiceNumber, setInvoiceNumber] = useState(loadData?.invoice_number || "");
  const [invoicedAt, setInvoicedAt] = useState(formatDateForInput(loadData?.invoiced_at));
  const [paymentTermsId, setPaymentTermsId] = useState(loadData?.payment_terms_id || "");
  const [rate, setRate] = useState(loadData?.rate || 0);
  const [adjustments, setAdjustments] = useState(loadData?.adjustments || []);

  // --- SECTION EDITING STATES ---
  // Tracks which section is currently in edit mode ('details' | 'rate' | null)
  const [editingSection, setEditingSection] = useState(null);

  // Temporary draft state for inline section editing
  const [detailsDraft, setDetailsDraft] = useState({
    invoiceNumber: "",
    invoicedAt: "",
    paymentTermsId: "",
  });
  const [rateDraft, setRateDraft] = useState(0);

  // --- ADJUSTMENT INPUT STATES ---
  const [adjDescription, setAdjDescription] = useState("");
  const [adjAmount, setAdjAmount] = useState("");

  // --- UI & API STATES ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- API HOOKS ---
  const updateInvoiceMutation = useMutation(api.loads.updateInvoiceDetails);

  const paymentTermsList =
    useQuery(
      api.payment_terms.getByBroker,
      loadData?.broker_id ? { broker_id: loadData.broker_id } : "skip"
    ) || [];

  // Sync main state if initial loadData updates remotely
  useEffect(() => {
    if (loadData) {
      setInvoiceNumber(loadData.invoice_number || "");
      setInvoicedAt(formatDateForInput(loadData.invoiced_at));
      setPaymentTermsId(loadData.payment_terms_id || "");
      setRate(loadData.rate || 0);
      setAdjustments(loadData.adjustments || []);
    }
  }, [loadData]);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl) window.URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // --- SAVE TO DATABASE ---
  const saveToDatabase = useCallback(
    async (updatedFields) => {
      if (!loadData?._id) return;
      setIsSaving(true);
      try {
        await updateInvoiceMutation({
          id: loadData._id,
          ...updatedFields,
        });
      } catch (err) {
        console.error("Save error:", err);
        toast.error("Failed to save load changes.");
      } finally {
        setIsSaving(false);
      }
    },
    [loadData?._id, updateInvoiceMutation]
  );

  // --- EDIT & CANCEL ACTION HANDLERS ---
  const handleStartEditDetails = () => {
    setDetailsDraft({
      invoiceNumber,
      invoicedAt,
      paymentTermsId,
    });
    setEditingSection("details");
  };

  const handleSaveDetails = async () => {
    setInvoiceNumber(detailsDraft.invoiceNumber);
    setInvoicedAt(detailsDraft.invoicedAt);
    setPaymentTermsId(detailsDraft.paymentTermsId);

    await saveToDatabase({
      invoice_number: detailsDraft.invoiceNumber,
      invoiced_at: detailsDraft.invoicedAt,
      payment_terms_id: detailsDraft.paymentTermsId,
    });

    setEditingSection(null);
  };

  const handleCancelDetails = () => {
    setEditingSection(null);
  };

  const handleStartEditRate = () => {
    setRateDraft(rate/100);
    setEditingSection("rate");
  };

  const handleSaveRate = async () => {
    const numericRate = Number(rateDraft) * 100 || 0;
    setRate(numericRate);

    await saveToDatabase({
      rate: numericRate,
    });

    setEditingSection(null);
  };

  const handleCancelRate = () => {
    setEditingSection(null);
  };

  // --- LIVE PREVIEW COMPILATION ---
  useEffect(() => {
    let active = true;

    const fetchInvoiceBlob = async () => {
      setIsPreviewLoading(true);
      try {
        const payload = mapLoadToInvoicePayload(
          {
            ...loadData,
            invoice_number: invoiceNumber,
            invoiced_at: invoicedAt,
            payment_terms_id: paymentTermsId,
            rate: Number(rate),
            carrier: carrierData,
          },
          adjustments
        );

        const res = await fetch("https://invoice4all.vercel.app/api", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.NEXT_PUBLIC_INVOICE4ALL_API_KEY || "",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Preview generation failed");

        const blob = await res.blob();
        if (active) {
          const url = window.URL.createObjectURL(blob);
          setPreviewUrl((prev) => {
            if (prev) window.URL.revokeObjectURL(prev);
            return url;
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setIsPreviewLoading(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchInvoiceBlob();
    }, 450);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [invoiceNumber, invoicedAt, paymentTermsId, rate, adjustments, loadData, carrierData]);

  // --- ADJUSTMENT HANDLERS ---
  const handleAddAdjustment = async (type) => {
    if (!adjDescription || !adjAmount) return;

    const amountInCents = Math.round(parseFloat(adjAmount) * 100);
    const newAdj = {
      id: crypto.randomUUID(),
      description: adjDescription,
      type,
      amountCents: amountInCents,
    };

    const targetList = [...adjustments, newAdj];
    setAdjustments(targetList);
    setAdjDescription("");
    setAdjAmount("");

    await saveToDatabase({ adjustments: targetList });
  };

  const handleRemoveAdjustment = useCallback(
    async (id) => {
      const targetList = adjustments.filter((a) => a.id !== id);
      setAdjustments(targetList);
      await saveToDatabase({ adjustments: targetList });
    },
    [adjustments, saveToDatabase]
  );

  const handleDownloadInvoice = useCallback(() => {
    if (!previewUrl) return;
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = `Invoice-${invoiceNumber || "draft"}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [previewUrl, invoiceNumber]);

  // --- FINANCIAL MATH ---
  const additionsCents = adjustments
    .filter((a) => a.type === "addition")
    .reduce((acc, cur) => acc + (cur.amountCents || 0), 0);

  const deductionsCents = adjustments
    .filter((a) => a.type === "deduction")
    .reduce((acc, cur) => acc + (cur.amountCents || 0), 0);

  const netTotalCents = rate + additionsCents - deductionsCents;

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start p-1">
      {/* LEFT COLUMN: EDITABLE CONTROLS */}
      <div className="lg:col-span-5 space-y-4 pr-1">
        
        {/* 1. GENERAL & TERMS */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" /> Invoice Details
              </CardTitle>
              <CardDescription className="text-xs pl-6">
                Basic identification and payment terms.
              </CardDescription>
            </div>
            {editingSection === "details" ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleCancelDetails}
                  disabled={isSaving}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1"
                  onClick={handleSaveDetails}
                  disabled={isSaving}
                >
                  <CheckIcon className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={handleStartEditDetails}
                disabled={editingSection !== null || isSaving}
              >
                <PencilIcon className="h-3 w-3" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="invoice_number" className="text-xs font-medium">
                  Invoice #
                </Label>
                <Input
                  id="invoice_number"
                  disabled={editingSection !== "details"}
                  value={
                    editingSection === "details"
                      ? detailsDraft.invoiceNumber
                      : invoiceNumber
                  }
                  onChange={(e) =>
                    setDetailsDraft((prev) => ({
                      ...prev,
                      invoiceNumber: e.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="invoiced_at"
                  className="text-xs font-medium flex items-center gap-1"
                >
                  <CalendarIcon className="h-3 w-3 text-muted-foreground" /> Date
                </Label>
                <Input
                  id="invoiced_at"
                  type="date"
                  disabled={editingSection !== "details"}
                  value={
                    editingSection === "details" ? detailsDraft.invoicedAt : invoicedAt
                  }
                  onChange={(e) =>
                    setDetailsDraft((prev) => ({
                      ...prev,
                      invoicedAt: e.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-medium flex items-center gap-1">
                <CreditCardIcon className="h-3 w-3 text-muted-foreground" /> Payment Terms
              </Label>
              <Select
                disabled={editingSection !== "details"}
                value={
                  editingSection === "details"
                    ? detailsDraft.paymentTermsId
                    : paymentTermsId
                }
                onValueChange={(val) =>
                  setDetailsDraft((prev) => ({
                    ...prev,
                    paymentTermsId: val,
                  }))
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select broker payment terms..." />
                </SelectTrigger>
                <SelectContent>
                  {paymentTermsList.map((term) => (
                    <SelectItem key={term._id} value={term._id} className="text-xs">
                      {term.name} ({term.days_to_pay} days
                      {term.is_quickpay ? ` • ${term.fee_percent}% QP` : ""})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 2. BASE RATE & CALCULATION SUMMARY */}
        <Card className="shadow-sm border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <CalculatorIcon className="h-4 w-4" /> Rate Summary
            </CardTitle>
            {editingSection === "rate" ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  onClick={handleCancelRate}
                  disabled={isSaving}
                >
                  <XIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1"
                  onClick={handleSaveRate}
                  disabled={isSaving}
                >
                  <CheckIcon className="h-3.5 w-3.5" /> Save
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs gap-1"
                onClick={handleStartEditRate}
                disabled={editingSection !== null || isSaving}
              >
                <PencilIcon className="h-3 w-3" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="space-y-1">
              <Label htmlFor="rate" className="text-xs font-medium">
                Line Haul Rate (USD)
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="rate"
                  type="number"
                  step="1"
                  disabled={editingSection !== "rate"}
                  value={editingSection === "rate" ? rateDraft : rate/100}
                  onChange={(e) => setRateDraft(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="rounded-md bg-muted/50 p-2.5 space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Base Line Haul:</span>
                <span>{formatCentsToUSD(rate)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>Extra Charges:</span>
                <span>+{formatCentsToUSD(additionsCents)}</span>
              </div>
              <div className="flex justify-between text-red-600 dark:text-red-400">
                <span>Deductions:</span>
                <span>-{formatCentsToUSD(deductionsCents)}</span>
              </div>
              <div className="border-t border-border pt-1.5 mt-1 flex justify-between font-bold text-foreground">
                <span>Total Invoice Amount:</span>
                <span className="text-sm">{formatCentsToUSD(netTotalCents)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. ACCESSORIALS & ADJUSTMENTS */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4" /> Charges & Discounts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4">
            <div className="space-y-2">
              <Input
                placeholder="Description (e.g. Detention, Lumper)"
                value={adjDescription}
                onChange={(e) => setAdjDescription(e.target.value)}
                className="h-8 text-xs"
              />
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                className="text-xs h-8 gap-1 border-green-200 bg-green-50/50 text-green-700 hover:bg-green-100 dark:bg-green-950/30 dark:text-green-400"
                disabled={isSaving || !adjDescription || !adjAmount}
                onClick={() => handleAddAdjustment("addition")}
              >
                <PlusCircleIcon className="h-3.5 w-3.5" /> Charge
              </Button>

              <Button
                type="button"
                variant="outline"
                className="text-xs h-8 gap-1 border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400"
                disabled={isSaving || !adjDescription || !adjAmount}
                onClick={() => handleAddAdjustment("deduction")}
              >
                <MinusCircleIcon className="h-3.5 w-3.5" /> Deduct
              </Button>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="text-[11px] font-medium text-muted-foreground mb-1.5">
                Applied Items ({adjustments.length})
              </p>
              {adjustments.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2 italic border border-dashed rounded-md">
                  No extra charges added.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {adjustments.map((adj) => (
                    <div
                      key={adj.id}
                      className="flex justify-between items-center text-xs p-2 rounded-md bg-muted/40 border border-border"
                    >
                      <div className="truncate max-w-[130px]">
                        <p className="font-medium truncate">{adj.description}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{adj.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-semibold text-xs",
                            adj.type === "addition"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          )}
                        >
                          {adj.type === "addition" ? "+" : "-"}
                          {formatCentsToUSD(adj.amountCents)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveAdjustment(adj.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RIGHT COLUMN: LIVE PDF PREVIEW */}
      <Card className="border-border shadow-sm lg:col-span-7 flex flex-col h-[calc(100vh-55px)]">
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Eye className="w-4 h-4 text-muted-foreground" /> PDF Preview
            {isSaving && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-primary" /> Saving...
              </span>
            )}
            {!isSaving && isPreviewLoading && (
              <span className="text-xs text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-primary" /> Rendering...
              </span>
            )}
            {!isSaving && !isPreviewLoading && previewUrl && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                <CheckCircle2Icon className="w-3 h-3" /> Synced
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="text-xs h-8 gap-1.5 shadow-sm"
            disabled={!previewUrl}
            onClick={handleDownloadInvoice}
          >
            <Download className="h-3.5 w-3.5" /> Download PDF
          </Button>
        </CardHeader>

        <CardContent className="flex-1 w-full overflow-hidden relative flex items-center justify-center">
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
              <p className="text-xs text-muted-foreground font-medium">
                Generating live invoice PDF...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
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