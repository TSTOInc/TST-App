"use client"
export const dynamic = "force-dynamic";
import React, { useEffect, useState } from 'react'
import ProfileHeader from '../../../components/layout/ProfileHeader'
import { useSearchParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react"
import { IconTrash, IconLoader2, IconUpload, IconPlus } from '@tabler/icons-react'
import PDFPreview from "@/components/custom/PDFPreview";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import DocUpload from "@/components/custom/DocUpload";
import { se } from 'date-fns/locale/se';
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
import { tr } from 'date-fns/locale/tr';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"



const ContactCard = ({ truck }) => {
    const plates = truck?.plates ?? [];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 ml-4">
                <p>Vin: {truck.vin || "N/A"}</p>
                <p>Make: {truck.make || "N/A"} Model: {truck.model || "N/A"}</p>
                <p>Year: {truck.year || "N/A"}</p>
            </CardContent>

            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Plates</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-row flex-wrap gap-2 ml-4">
                {plates.map((plate, index) => (
                    <Card className="py-2 py-4" key={index}>
                        <CardContent>
                            <p>
                                {plate.plate_number || "N/A"} | {plate.state || ""}, {plate.country || ""}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </CardContent>
        </Card>
    )
}

const addOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return day + "th";
    switch (day % 10) {
        case 1: return day + "st";
        case 2: return day + "nd";
        case 3: return day + "rd";
        default: return day + "th";
    }
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    const parts = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }).split(" ");
    return `${parts[0]} ${addOrdinalSuffix(parseInt(parts[1]))} ${parts[2]}`;
};

const InspectionsCard = ({ truck, setTruckData, inspectionIntervalDays = 90 }) => {
    const inspections = truck?.inspections ?? [];
    const nextInspectionDate = () => {
        if (!inspections.length) return "N/A";
        const sorted = [...inspections].sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));
        const lastInspection = sorted[0];
        const lastDate = new Date(lastInspection.inspection_date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + inspectionIntervalDays);
        return formatDate(nextDate)
    };
    const [inspectionType, setInspectionType] = useState("90_day");
    const [result, setResult] = useState("pass");
    const [inspectionDate, setInspectionDate] = useState(""); // renamed to match API
    const [notes, setNotes] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false); // <-- control sheet open state

    const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
        truck_id: truck.id,
        inspection_type: inspectionType,
        inspection_date: inspectionDate,
        result,
        notes,
    };

    try {
        await toast.promise(
            (async () => {
                // Submit inspection
                const response = await fetch(
                    `api/add/truck_inspections`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload),
                    }
                );

                if (!response.ok) throw new Error("Failed to create inspection");
                await response.json();

                // Refresh truck data
                const res = await fetch(`api/get/trucks/${truck.id}`, { cache: "no-cache" });
                const updatedTruck = await res.json();
                setTruckData(updatedTruck);

                // Reset form & close sheet
                setInspectionType("90_day");
                setResult("pass");
                setInspectionDate("");
                setNotes("");
                setIsSheetOpen(false);
            })(),
            {
                loading: "Adding inspection...",
                success: "Inspection added successfully!",
                error: (err) => err.message || "Failed to add inspection",
            }
        );
    } catch (error) {
        console.error(error);
    }
};

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Inspections</CardTitle>
                <div className="flex flex-row items-center gap-4">
                    <div>Next Inspection: {nextInspectionDate()}</div>
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <IconPlus /> Add Inspection
                            </Button>
                        </SheetTrigger>

                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Add a New Inspection</SheetTitle>
                                <SheetDescription>
                                    Fill in the details below to create a new inspection record.
                                </SheetDescription>
                            </SheetHeader>

                            <form onSubmit={handleSubmit} className="space-y-4 p-4">
                                {/* Your inputs */}
                                <Label htmlFor="inspectionType">Inspection Type</Label>
                                <Select
                                    value={inspectionType}
                                    onValueChange={(val) => setInspectionType(val)}
                                >
                                    <SelectTrigger id="inspectionType" className="w-40">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="90_day">90 Days Inspection</SelectItem>
                                        <SelectItem value="daily">Daily Inspection</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Label htmlFor="inspectionDate">Inspection Date</Label>
                                <Input
                                    id="inspectionDate"
                                    type="date"
                                    value={inspectionDate}
                                    onChange={(e) => setInspectionDate(e.target.value)}
                                />

                                <Label htmlFor="result">Result</Label>
                                <Select value={result} onValueChange={(val) => setResult(val)}>
                                    <SelectTrigger id="result" className="w-40">
                                        <SelectValue placeholder="Select result" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pass">Pass</SelectItem>
                                        <SelectItem value="fail">Fail</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                    id="notes"
                                    placeholder="Notes"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />

                                <Button type="submit">Add Inspection</Button>
                            </form>
                        </SheetContent>
                    </Sheet>



                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {inspections.length === 0 ? (
                    <p className="text-neutral-500 italic">
                        No inspections found for {truck.truck_number}
                    </p>
                ) : (
                    inspections.map((inspection, idx) => (
                        <Card className="py-2" key={inspection.brokerId || idx}>
                            <Collapsible key={inspection.brokerId || idx} defaultOpen={false}>
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                                        <CardTitle>
                                            <div className="flex items-center gap-4">
                                                {formatDate(inspection.inspection_date)} | {inspection.inspection_type}
                                                <Badge status={inspection.result}></Badge>
                                            </div>
                                        </CardTitle>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            <ChevronsUpDown />
                                            <span className="sr-only">Toggle</span>
                                        </Button>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="pt-2">
                                        <Textarea readOnly value={inspection.notes || ""} placeholder="No notes found" />
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

const RepairsCard = ({ truck, repairsIntervalDays = 90 }) => {
    const repairs = truck?.repairs ?? [];
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Repairs</CardTitle>
                <Button>
                    <IconPlus /> Add Repair
                </Button>
            </CardHeader>
            <CardContent className="space-y-2">
                {repairs.length === 0 ? (
                    <p className="text-neutral-500 italic">
                        No repairs found for {truck.truck_number}
                    </p>
                ) : (
                    repairs.map((repair, idx) => (
                        <Card className="py-2" key={repair.id || idx}>
                            <Collapsible key={repair.id || idx} defaultOpen={false}>
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="flex flex-row items-center justify-between cursor-pointer">
                                        <CardTitle>
                                            <div className="flex items-center gap-4">
                                                {formatDate(repair.repair_date)} | ${repair.repair_cost}
                                            </div>
                                        </CardTitle>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            <ChevronsUpDown />
                                            <span className="sr-only">Toggle</span>
                                        </Button>
                                    </CardHeader>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <CardContent className="pt-2">
                                        <Textarea readOnly value={repair.repair_description || ""} placeholder="No repair description found" />
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))
                )}
            </CardContent>
        </Card>
    );
};

const DocumentsCard = ({ truck, setTruckData }) => {
    const documents = truck?.docs ?? [];
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
                `api/upload/image/trucks/${truck.id}/docs`,
                { method: "POST", body: formData }
            );
            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url: documentUrl } = await uploadRes.json();

            const addRes = await fetch(
                `api/add/trucks/${truck.id}/docs`,
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

    const handleDelete = async (documentUrl, truckId) => {
        try {
            await toast.promise(
                fetch(`api/delete/trucks/${truckId}/docs`, {
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
                <CardTitle>Truck Documents</CardTitle>
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="default">
                            <IconPlus /> Add Document
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
                        No documents found for {truck.truck_number}
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
                                                    handleDelete(doc, truck.id);
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

export default function TablePage({ params }) {
    const { id } = React.use(params);
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const searchParams = useSearchParams();
    const router = useRouter();
    const tabFromQuery = searchParams.get("tab") || "info";
    const [activeTab, setActiveTab] = useState(tabFromQuery);

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`api/get/trucks/${id}`, { cache: "no-cache" })
                if (!res.ok) throw new Error('Failed to fetch data')
                const data = await res.json()
                setData(data || null)
            } catch (err) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }
        fetchdata()
    }, [])

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        if (tab === "info") router.replace(window.location.pathname);
        else router.replace(`?tab=${tab}`);
    };

    if (loading) return <div><ProfileHeader name="Loading..." role="Loading..." /><div className="p-4">Loading...</div></div>
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return <div>No data found for <b>{id}</b>.</div>

    return (
        <div>
            <ProfileHeader data={data} id={data.id} table="trucks" image_url={data.image_url} name={data.truck_number} alias={data.truck_alias} role={`Year: ${data.year ?? "N/A"}`} status={data.status} color={data.color} />
            <div className="p-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="w-full h-10">
                        <TabsTrigger value="info"><span className="md:p-4 lg:p-6 xl:p-8">Truck Info</span></TabsTrigger>
                        <TabsTrigger value="inspections"><span className="md:p-4 lg:p-6 xl:p-8">Inspections</span></TabsTrigger>
                        <TabsTrigger value="repairs"><span className="md:p-4 lg:p-6 xl:p-8">Repairs</span></TabsTrigger>
                        <TabsTrigger value="documents"><span className="md:p-4 lg:p-6 xl:p-8">Documents</span></TabsTrigger>
                    </TabsList>

                    <TabsContent value="info"><ContactCard truck={data} /></TabsContent>
                    <TabsContent value="inspections"><InspectionsCard truck={data} setTruckData={setData} /></TabsContent>
                    <TabsContent value="repairs"><RepairsCard truck={data} /></TabsContent>
                    <TabsContent value="documents"><DocumentsCard truck={data} setTruckData={setData} /></TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
