"use client"
import React, { useEffect, useState } from 'react'
import ProfileHeader from '../../../components/layout/ProfileHeader'
import { use, useMemo } from "react"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { IconLoader2 } from '@tabler/icons-react'
import { toast } from "sonner"; // or "@/components/ui/sonner" if aliased
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSearchParams, useRouter } from "next/navigation";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react"
import PDFPreview from "@/components/custom/PDFPreview";
import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog";

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

            {/* Flex container for plates */}
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
const InspectionsCard = ({ truck, inspectionIntervalDays = 90 }) => {
    const inspections = truck?.inspections ?? [];

    // Calculate next inspection based on last inspection
    const nextInspectionDate = () => {
        if (!inspections.length) return "N/A";

        // Sort inspections by date descending
        const sorted = [...inspections].sort(
            (a, b) => new Date(b.inspection_date) - new Date(a.inspection_date)
        );
        const lastInspection = sorted[0];
        const lastDate = new Date(lastInspection.inspection_date);

        // Add interval
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + inspectionIntervalDays);

        return formatDate(nextDate) // Format nicely
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Inspections</CardTitle>
                <div>Next Inspection: {nextInspectionDate()}</div>
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
                                        <Textarea
                                            readOnly
                                            value={inspection.notes || ""}
                                            placeholder="No notes found"
                                        />
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

    // Next inspection date from inspections (for context)
    const nextRepairDate = () => {
        if (!repairs.length) return "N/A";

        const sorted = [...repairs].sort(
            (a, b) => new Date(b.repair_date) - new Date(a.repair_date)
        );
        const lastRepair = sorted[0];
        const lastDate = new Date(lastRepair.repair_date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + repairsIntervalDays);

        return formatDate(nextDate);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Repairs</CardTitle>
                <div>Next Repair: {nextRepairDate()}</div>
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
                                        <Textarea
                                            readOnly
                                            value={repair.repair_description || ""}
                                            placeholder="No repair description found"
                                        />
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
const DocumentsCard = ({ truck }) => {
    const documents = truck?.docs ?? [];
    const [selectedDoc, setSelectedDoc] = useState(null);
    return (
        <>
            {/* Grid of document previews */}
            <div className="w-full grid gap-4 grid-cols-1 sm:grid-cols-3 md:grid-cols-5">
                {documents.map((doc, idx) => (
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
                                    pointerEvents: "none", // non-interactive
                                    userSelect: "none",
                                    display: "block",
                                }}
                            />
                        </CardContent>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>
                                {doc ? decodeURIComponent(doc.split("/").pop()) : "Unnamed Document"}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                ))}
            </div>

            {/* Modal for fullscreen PDF */}
            <Dialog
                open={!!selectedDoc}
                onOpenChange={(open) => !open && setSelectedDoc(null)}
            >
                <DialogContent fullscreen>
                    <DialogHeader>
                        <DialogTitle>
                            <span>{""}</span>
                        </DialogTitle>
                    </DialogHeader>
                    {selectedDoc && (
                        <embed
                            src={selectedDoc}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
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
                const res = await fetch(`https://tst.api.incashy.com/get/trucks/${id}`, {
                    cache: "no-cache"
                })
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
    const deleteTruck = async (id) => {
        try {
            const res = await fetch(`https://tst.api.incashy.com/delete/trucks/${id}`, {
                cache: "no-cache",
                method: "DELETE",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Failed to delete truck");
            }

            router.back();

            const data = await res.json();
            toast.success("Truck deleted successfully!");
            return data;
        } catch (err) {
            console.error("Delete truck error:", err);
            toast.error(`Error deleting truck: ${err.message}`);
            throw err;
        }
    };

    const handleTabChange = (tab) => {
        if (tab === activeTab) return; // Prevent unnecessary state updates
        setActiveTab(tab);

        if (tab === "info") {
            // Remove the query for the default tab
            router.replace(window.location.pathname);
        } else {
            // Update query for other tabs
            router.replace(`?tab=${tab}`);
        }
    };


    if (loading) return (
        <div>
            <ProfileHeader  name={"Loading..."} role={`Loading...`} />
            <div className="p-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList>
                        <TabsTrigger value="info"><span className="p-4">Truck Info</span></TabsTrigger>
                        <TabsTrigger value="inspections"><span className="p-4">Inspections</span></TabsTrigger>
                        <TabsTrigger value="repairs"><span className="p-4">Repairs</span></TabsTrigger>
                        <TabsTrigger value="documents"><span className="p-4">Documents</span></TabsTrigger>
                    </TabsList>
                    <TabsContent value="info">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <ContactCard truck={data} />
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return <div>No data found for <b>{id}</b>.</div>

    return (
        <div>
            <ProfileHeader id={data.id} table="trucks" image_url={data.image_url} name={data.truck_number} alias={data.truck_alias} role={`Year: ${data.year}`} status={data.status} color={data.color} />
            <div className="p-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList>
                        <TabsTrigger value="info"><span className="p-4">Truck Info</span></TabsTrigger>
                        <TabsTrigger value="inspections"><span className="p-4">Inspections</span></TabsTrigger>
                        <TabsTrigger value="repairs"><span className="p-4">Repairs</span></TabsTrigger>
                        <TabsTrigger value="documents"><span className="p-4">Documents</span></TabsTrigger>
                    </TabsList>
                    <TabsContent value="info">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                <ContactCard truck={data} />
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="inspections">
                        <InspectionsCard truck={data} />
                    </TabsContent>
                    <TabsContent value="repairs">
                        <RepairsCard truck={data} />
                    </TabsContent>
                    <TabsContent value="documents">
                        <DocumentsCard truck={data} />
                    </TabsContent>
                </Tabs>
            </div>

        </div>
    )
}
