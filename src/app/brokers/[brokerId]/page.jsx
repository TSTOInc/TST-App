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
const AgentsCard = ({ broker }) => {
    const [showAll, setShowAll] = useState(false);

    const agents = broker?.broker_agents ?? [];

    // Limit to 3 unless showAll is true
    const agentsToShow = showAll ? agents : agents.slice(0, 3);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Broker Agents</CardTitle>
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
                                    <Button variant="link"><Link href={`/brokers/${broker.id}/agents/${agent.id}`}>View</Link></Button>
                                </CardHeader>
                            </Card>
                        ))}

                        {!showAll && agents.length > 3 && (
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
const PaymentCard = ({ broker }) => {
    const [showAll, setShowAll] = useState(false);

    const loads = broker?.payment_terms ?? [];

    // Limit to 3 unless showAll is true
    const loadsToShow = showAll ? loads : loads.slice(0, 3);
    return (
        <Card>
            <CardHeader>
                <CardTitle>Broker Pay Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {loads.length === 0 ? (
                    // No agents: show empty card content or a message if you want
                    <p className="text-neutral-500 italic">no pay terms found for {broker.name}</p>
                ) : (
                    <>
                        {loadsToShow.map((agent, brokerIdx) => (
                            <Card className="py-4" key={agent.brokerId || brokerIdx}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>{agent.name}<span className='text-neutral-400'> | {agent.email}</span></CardTitle>
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
            const res = await fetch(`https://tst.api.incashy.com/update/brokers/${broker.id}`, {
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

    useEffect(() => {
        const fetchdata = async () => {
            setLoading(true)
            setError(null)
            try {
                const res = await fetch(`https://tst.api.incashy.com/get/brokers/${brokerId}`, {
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

    if (loading) return (
        <div>
            <ProfileHeader  name={"Loading..."} company={"Loading..."} />
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
            <ProfileHeader id={data.id} table="brokers" image_url={data.image_url} name={data.name} company={"USDOT-" + data.usdot_number + " | " + data.docket_number} link={"directory/" + data.usdot_number} website={data.website} status={data.status} />
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
}