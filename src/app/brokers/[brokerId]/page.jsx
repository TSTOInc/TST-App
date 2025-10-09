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
import { IconEye, IconLoader2, IconPlus, IconTrash } from '@tabler/icons-react'
import { toast } from "sonner"; // or "@/components/ui/sonner" if aliased
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldSet,
} from "@/components/ui/field"

const ContactCard = ({ carrier }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Broker Info</CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
            <p>Address: {carrier.address || "N/A"}</p>
            <p>Email: {carrier.email || "N/A"}</p>
            <p>Phone: {carrier.phone || "N/A"}</p>
            <p>Website: <Link href={"https://" + carrier.website || "#"}>{carrier.website || "N/A"}</Link></p>
        </CardContent>
    </Card>
)




const AgentsCard = ({ broker, onAgentAdded }) => {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [agent_name, setAgentName] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [position, setPosition] = useState("")

    const [open, setOpen] = useState(false) // controls sheet

    const agents = broker?.broker_agents ?? [];
    // Limit to 3 unless showAll is true
    const agentsToShow = agents.slice(0, 2);

    async function handleAddAgent() {
        if (!agent_name) return toast.error("Agent name is required")
        setIsSubmitting(true)

        const payload = {
            name: agent_name,
            email,
            phone,
            position,
            broker_id: broker.id,
        }
        console.log(payload)

        const promise = fetch(`${process.env.NEXT_PUBLIC_API_BASE}/add/brokers/agents`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        }).then(async (res) => {
            if (!res.ok) throw new Error("Failed to add term")
            return res.json()
        })

        toast.promise(promise, {
            loading: "Adding Agent...",
            success: "Agent added successfully!",
            error: "Failed to add Agent",
        })

        try {
            await promise
            setOpen(false) // 👈 close the sheet
            onAgentAdded?.();
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Broker Agents</CardTitle>
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button>
                            <IconPlus />
                            Add Agent
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader className="p-4">
                            <SheetTitle>Add Agent</SheetTitle>
                            <SheetDescription>
                                Add new Agent for {broker.name}
                            </SheetDescription>
                        </SheetHeader>

                        <div className='p-4'>
                            <FieldSet>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel required htmlFor="name">Agent Name</FieldLabel>
                                        <Input id="name" type="text" placeholder="Max Leiter" onChange={(e) => setAgentName(e.target.value)} />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="email">Email</FieldLabel>
                                        <Input id="email" type="email" placeholder="example@email.com" onChange={(e) => setEmail(e.target.value)} />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="phone">Phone</FieldLabel>
                                        <Input id="phone" type="text" placeholder="(123) 456-7890" onChange={(e) => setPhone(e.target.value)} />
                                    </Field>
                                    <Field>
                                        <FieldLabel htmlFor="position">Position</FieldLabel>
                                        <Input id="position" type="text" placeholder="Account Manager" onChange={(e) => setPosition(e.target.value)} />
                                    </Field>
                                </FieldGroup>
                            </FieldSet>
                        </div>

                        <SheetFooter>
                            {/* this button just triggers the handler */}
                            <Button
                                type="button"
                                disabled={isSubmitting || !agent_name}
                                onClick={handleAddAgent}
                            >
                                Add Agent
                            </Button>

                            <SheetClose asChild>
                                <Button variant="outline">Cancel</Button>
                            </SheetClose>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </CardHeader>

            <CardContent className="space-y-2">
                {agents.length === 0 ? (
                    // No agents: show empty card content or a message if you want
                    <p className="text-neutral-500 italic">no agents found for {broker.name}</p>
                ) : (
                    <>
                        {agentsToShow.map((agent, brokerIdx) => (
                            <Card className="py-2" key={agent.brokerId || brokerIdx}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>{agent.name}</CardTitle>
                                    <Link href={`/brokers/${broker.id}/agents/${agent.id}`} className='p-2 hover:bg-muted rounded-md'><IconEye className='w-5 h-5 ' /></Link>
                                </CardHeader>
                            </Card>
                        ))}

                        {agents.length > 2 && (
                            <Button variant="outline" asChild>
                                <Link href={`/brokers/${broker.id}/agents`}>
                                    View All
                                </Link>
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const LoadsCard = ({ broker }) => {
    const [showAll, setShowAll] = useState(false);

    const loads = broker?.loads ?? [];

    // Limit to 3 unless showAll is true
    const loadsToShow = showAll ? loads : loads.slice(0, 3);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Broker Loads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {loads.length === 0 ? (
                    // No agents: show empty card content or a message if you want
                    <p className="text-neutral-500 italic">no agents found for {broker.name}</p>
                ) : (
                    <>
                        {loadsToShow.map((agent, brokerIdx) => (
                            <Card className="py-2" key={agent.brokerId || brokerIdx}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>{agent.name}</CardTitle>
                                    <Button variant="link">View</Button>
                                </CardHeader>
                            </Card>
                        ))}

                        {!showAll && loads.length > 3 && (
                            <Button onClick={() => setShowAll(true)} className="mt-2" variant="outline">
                                Show All
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
};

const PaymentCard = ({ broker, onPaymentTermAdded }) => {
    const [showAll, setShowAll] = useState(false)
    const [selected, setSelected] = useState("standard")
    const [days, setDays] = useState("3")
    const [fee, setFee] = useState("3")
    const [email, setEmail] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [open, setOpen] = useState(false) // controls sheet

    const loads = broker?.payment_terms ?? []
    const loadsToShow = showAll ? loads : loads.slice(0, 3)


    async function handleAddTerm() {
        setIsSubmitting(true)

        const payload = {
            name:
                selected === "quickpay"
                    ? `QuickPay ${days} Days - ${fee}%`
                    : `Net ${days} days`,
            days_to_pay: Number(days),
            fee_percent: selected === "quickpay" ? Number(fee) : 0,
            is_quickpay: selected === "quickpay",
            email,
            broker_id: broker.id,
        }

        try {
            await toast.promise(
                (async () => {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE}/add/payment_terms`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload),
                        }
                    )

                    if (!res.ok) throw new Error("Failed to add term")

                    const data = await res.json()
                    await onPaymentTermAdded?.()
                    setOpen(false)
                    return data
                })(),
                {
                    loading: "Adding payment term...",
                    success: "Payment term added successfully!",
                    error: "Failed to add payment term",
                }
            )
        } catch (err) {
            console.error("Failed to add term", err)
        } finally {
            setIsSubmitting(false)
        }
    }


    async function handleDeleteTerm(termId) {
        try {
            await toast.promise(
                (async () => {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_BASE}/delete/payment_terms/${termId}`,
                        { method: "DELETE" }
                    )
                    if (!res.ok) throw new Error("Failed to delete term")
                    const data = await res.json()
                    await onPaymentTermAdded?.()
                    return data
                })(),
                {
                    loading: "Deleting payment term...",
                    success: "Payment term deleted successfully!",
                    error: "Failed to delete payment term",
                }
            )
        } catch (err) {
            console.error("Failed to delete term", err)
        }
    }


    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex flex-row items-center justify-between">
                    Broker Pay Terms
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button>
                                <IconPlus />
                                Add Term
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Add Term</SheetTitle>
                                <SheetDescription>
                                    Add new Payment Term for {broker.name}
                                </SheetDescription>
                            </SheetHeader>

                            <div className="grid flex-1 auto-rows-min gap-6 px-4">
                                <Label htmlFor="days-to-pay">Type of Payment</Label>
                                <RadioGroup
                                    value={selected}
                                    onValueChange={setSelected}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                                >
                                    {[
                                        { value: "standard", title: "Standard" },
                                        { value: "quickpay", title: "Quick Pay" },
                                    ].map((plan) => (
                                        <Label
                                            key={plan.value}
                                            htmlFor={plan.value}
                                            className={`${plan.value === selected ? "border-primary" : ""
                                                } flex items-center gap-3 border p-4 rounded-xl cursor-pointer transition`}
                                        >
                                            <RadioGroupItem
                                                value={plan.value}
                                                id={plan.value}
                                                className="peer w-5 h-5 border border-neutral-300 rounded-full checked:bg-primary checked:border-primary flex-shrink-0"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium">{plan.title}</span>
                                                <span className="text-sm text-muted-foreground font-normal">
                                                    {plan.description}
                                                </span>
                                            </div>
                                        </Label>
                                    ))}
                                </RadioGroup>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="grid gap-3 relative">
                                        <Label htmlFor="days-to-pay">Day(s) to Pay</Label>
                                        <Input
                                            id="days-to-pay"
                                            value={days}
                                            onChange={(e) => setDays(e.target.value)}
                                            className="pr-12"
                                        />
                                        <span className="absolute right-3 top-[34px] text-sm text-muted-foreground">
                                            Day(s)
                                        </span>
                                    </div>
                                    <div className="grid gap-3 relative">
                                        <Label
                                            htmlFor="fee-percentage"
                                            className={selected !== "quickpay" ? "text-muted-foreground" : ""}
                                        >
                                            Fee Percentage
                                        </Label>
                                        <Input
                                            id="fee-percentage"
                                            value={fee}
                                            onChange={(e) => setFee(e.target.value)}
                                            className="pr-12"
                                            disabled={selected !== "quickpay"}
                                        />
                                        <span className="absolute right-3 top-[34px] text-sm text-muted-foreground">
                                            %
                                        </span>
                                    </div>
                                </div>

                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@email.com"
                                />
                            </div>

                            <SheetFooter>
                                <SheetClose asChild>
                                    <Button
                                        type="button"
                                        disabled={isSubmitting}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleAddTerm(() => document.querySelector("[data-state=open] button")?.click())
                                        }}
                                    >
                                        Add Term
                                    </Button>
                                </SheetClose>
                                <SheetClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                </SheetClose>
                            </SheetFooter>
                        </SheetContent>
                    </Sheet>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                {loads.length === 0 ? (
                    <p className="text-neutral-500 italic">
                        no pay terms found for {broker.name}
                    </p>
                ) : (
                    <>
                        {loadsToShow.map((agent, idx) => (
                            <Card className="py-2" key={agent.brokerId || idx}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div className="flex flex-col">
                                        <CardTitle>{agent.name}</CardTitle>
                                        {agent.email && (
                                            <p className="text-sm text-muted-foreground">{agent.email}</p>
                                        )}
                                    </div>

                                    <Button variant="destructive" size="icon" onClick={() => handleDeleteTerm(agent.id)}>
                                        <IconTrash />
                                    </Button>
                                </CardHeader>
                            </Card>

                        ))}

                        {!showAll && loads.length > 3 && (
                            <Button
                                onClick={() => setShowAll(true)}
                                className="mt-2"
                                variant="outline"
                            >
                                Show All
                            </Button>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}

const NotesCard = ({ broker }) => {
    const [notes, setNotes] = useState("");
    const [originalNotes, setOriginalNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const initNotes = broker?.notes || "";
        setNotes(initNotes);
        setOriginalNotes(initNotes);
        setSuccess(false);
        setError(null);
    }, [broker]);

    // Warn user if notes have unsaved changes when leaving/reloading
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (notes !== originalNotes) {
                e.preventDefault();
                e.returnValue = ""; // required for Chrome
            }
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [notes, originalNotes]);

    const saveNotes = async () => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/update/brokers/${broker.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notes }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => null);
                throw new Error(errData?.error || "Failed to save notes");
            }

            setOriginalNotes(notes);
            setSuccess(true);
            toast.success("Notes saved successfully!");
        } catch (err) {
            setError(err.message);
            toast.error(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const isSaveDisabled = loading || notes === originalNotes;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Broker Notes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes..."
                    rows={6}
                    disabled={loading}
                />
                <div className="flex items-center space-x-4">
                    <Button onClick={saveNotes} disabled={isSaveDisabled}>
                        {loading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? "Saving..." : "Save"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};




export default function TablePage({ params }) {
    // Unwrap the params Promise
    const { brokerId } = React.use(params);
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const fetchdata = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/brokers/${brokerId}`, {
                cache: "no-cache",
            });
            if (!res.ok) throw new Error("Failed to fetch data");

            const json = await res.json();
            setData(json || null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchdata();
    }, [brokerId]);

    if (loading) return (
        <div>
            <ProfileHeader name={"Loading..."} company={"Loading..."} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ContactCard carrier={data} />
                    <AgentsCard broker={data} />
                    <PaymentCard broker={data} />
                    <NotesCard broker={data} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <LoadsCard broker={data} />
                </div>
            </div>


        </div>
    )
    if (error) return <div className="text-red-500">Error: {error}</div>
    if (!data || data.length === 0) return <div>No data found for <b>{brokerId}</b>.</div>

    return (
        <div>
            <ProfileHeader data={data} id={data.id} table="brokers" image_url={data.image_url} name={data.name} company={"USDOT-" + data.usdot_number + " | " + data.docket_number} link={"directory/" + data.usdot_number} website={data.website} status={data.status} />
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ContactCard carrier={data} />
                    <AgentsCard broker={data} onAgentAdded={fetchdata} />
                    <PaymentCard broker={data} onPaymentTermAdded={fetchdata} />
                    <NotesCard broker={data} />

                </div>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <LoadsCard broker={data} />
                </div>
            </div>


        </div>
    )
}