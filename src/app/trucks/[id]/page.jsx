"use client"
export const dynamic = "force-dynamic";
import React, { use, useEffect, useState } from 'react'
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
import { ChevronsUpDown, PlusIcon } from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import InfoCard from '@/components/data/info-card';
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { DialogDemo } from '@/components/data/upload/upload-doc';
import { DocumentCard } from '@/components/documents/document-card';


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
    const nextInspectionDate = () => {
        if (!inspections.length) return "N/A";
        const sorted = [...inspections].sort((a, b) => new Date(b.inspection_date) - new Date(a.inspection_date));
        const lastInspection = sorted[0];
        const lastDate = new Date(lastInspection.inspection_date);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + inspectionIntervalDays);
        return formatDate(nextDate)
    };

    const createInspection = useMutation(api.truck_inspections.create);

    const [inspectionType, setInspectionType] = useState("90_day");
    const [result, setResult] = useState("pass");
    const [inspectionDate, setInspectionDate] = useState(""); // renamed to match API
    const [notes, setNotes] = useState("");
    const [isSheetOpen, setIsSheetOpen] = useState(false); // <-- control sheet open state

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            truck_inspections: {
                org_id: truck.org_id,
                inspection_date: inspectionDate,
                inspection_type: inspectionType,
                notes: notes || null,
                result,
                truck_id: truck._id,
            },
        };

        try {
            await toast.promise(
                createInspection(payload), // ✅ directly call the mutation
                {
                    loading: "Adding inspection...",
                    success: "Inspection added successfully!",
                    error: "Failed to add inspection",
                }
            );

            // Reset form & close sheet
            setInspectionType("90_day");
            setResult("pass");
            setInspectionDate("");
            setNotes("");
            setIsSheetOpen(false);
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
                                <PlusIcon /> Add Inspection
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
                    <PlusIcon /> Add Repair
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

const DocumentsCard = ({ truck, documents }) => {

    const documentsToShow = documents?.filter((file) => file.category === "MISC") || [];


    return (
        <Card className="gap-4">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Truck Documents</CardTitle>
                <DialogDemo title="Add Document" multiple={true} category="MISC" entityType="trucks" entityId={truck._id} expires={false} />
            </CardHeader>

            <CardContent className="w-full grid gap-4 grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 px-4">
                {documentsToShow.length === 0 ? (
                    <p className="pt-2 pl-2 text-neutral-500 italic">
                        No documents found for {truck.truck_number}
                    </p>
                ) : (
                    documentsToShow.map((doc, idx) => (
                        <DocumentCard key={doc.id || idx} file={doc} />
                    ))
                )}
            </CardContent>
        </Card>
    )
};

export default function TablePage({ params }) {

    const { id } = React.use(params);

    const data = useQuery(api.trucks.byId, { id });
    const documents = useQuery(api.files.byId, { entityId: id, entityType: "trucks" }) || [];
    const Registration = documents.find((doc) => doc.category === "REGISTRATION");
    const IDCard = documents.find((doc) => doc.category === "ID_CARD");

    const searchParams = useSearchParams();
    const router = useRouter();
    const tabFromQuery = searchParams.get("tab") || "info";
    const [activeTab, setActiveTab] = useState(tabFromQuery);

    const handleTabChange = (tab) => {
        if (tab === activeTab) return;
        setActiveTab(tab);
        if (tab === "info") router.replace(window.location.pathname);
        else router.replace(`?tab=${tab}`);
    };
    if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

    return (
        <div>
            <ProfileHeader data={data} table="trucks" image_url={data.image_url} name={data.truck_number} alias={data.truck_alias} description={`Year: ${data.year ?? "N/A"}`} status={data.status} color={data.color} />
            <div className="p-4">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="w-full h-10">
                        <TabsTrigger value="info"><span className="md:p-4 lg:p-6 xl:p-8">Truck Info</span></TabsTrigger>
                        <TabsTrigger value="inspections"><span className="md:p-4 lg:p-6 xl:p-8">Inspections</span></TabsTrigger>
                        <TabsTrigger value="repairs"><span className="md:p-4 lg:p-6 xl:p-8">Repairs</span></TabsTrigger>
                        <TabsTrigger value="documents"><span className="md:p-4 lg:p-6 xl:p-8">Documents</span></TabsTrigger>
                    </TabsList>

                    <TabsContent value="info"><InfoCard
                        title="Truck Info"
                        fields={[
                            { label: "VIN", value: data.vin },
                            { label: "Year", value: data.year },
                            { label: "Make", value: data.make },
                            { label: "Model", value: data.model },
                        ]}
                    />
                    </TabsContent>
                    <TabsContent value="inspections"><InspectionsCard truck={data} /></TabsContent>
                    <TabsContent value="repairs"><RepairsCard truck={data} /></TabsContent>
                    <TabsContent value="documents" className="space-y-4">
                        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Truck Registration</CardTitle>
                                    {!Registration && (
                                        <DialogDemo title="Add Registration" category="REGISTRATION" entityType="trucks" entityId={data._id} expires={true} />
                                    )}
                                </CardHeader>

                                <CardContent>
                                    {!Registration ? (
                                        <p className="pt-2 pl-2 text-neutral-500 italic">
                                            No Registration found for {data.truck_number}
                                        </p>
                                    ) : (
                                        <DocumentCard file={Registration} />
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Truck ID Card</CardTitle>
                                    {!IDCard && (
                                        <DialogDemo title="Add ID Card" category="ID_CARD" entityType="trucks" entityId={data._id} expires={true} />
                                    )}
                                </CardHeader>

                                <CardContent>
                                    {!IDCard ? (
                                        <p className="pt-2 pl-2 text-neutral-500 italic">
                                            No ID Card found for {data.truck_number}
                                        </p>
                                    ) : (
                                        <DocumentCard file={IDCard} />
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                        <DocumentsCard truck={data} documents={documents} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
