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
import { IconEye, IconLoader2, IconMapPin, IconPlus, IconTrash } from '@tabler/icons-react'
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

import { useQuery, useMutation } from "convex/react"
import { api } from '@convex/_generated/api'
import InfoCard from '@/components/data/info-card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DialogDemo } from '@/components/data/upload/upload-doc'
import { DocumentCard } from '@/components/documents/document-card'
import { LoadCard } from '@/components/data/load/load-card'

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

    const promise = fetch(`/api/add/brokers/agents`, {
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

const LoadsCard = ({ loads, broker }) => {
  const [showAll, setShowAll] = useState(false);

  const t_loads = loads || [];

  // Limit to 3 unless showAll is true
  const loadsToShow = showAll ? t_loads : t_loads.slice(0, 3);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Broker Loads</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {loads.length === 0 ? (
          // No agents: show empty card content or a message if you want
          <p className="text-neutral-500 italic">no loads found for {broker.name}</p>
        ) : (
          <>
            {loadsToShow.map((load) => (
              <LoadCard key={load._id} load={load} />
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

const PaymentCard = ({ broker, orgId }) => {
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState("standard");
  const [days, setDays] = useState("3");
  const [fee, setFee] = useState("3");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const loads = broker?.payment_terms ?? [];
  const loadsToShow = showAll ? loads : loads.slice(0, 3);

  // Convex mutations
  const addPaymentTerm = useMutation(api.payment_terms.create)
  const deletePaymentTerm = useMutation(api.delete.byId);

  async function handleAddTerm() {
    setIsSubmitting(true);
    const payload = {
      name:
        selected === "quickpay"
          ? `QuickPay ${days} Days - ${fee}%`
          : `Net ${days} days`,
      days_to_pay: Number(days),
      fee_percent: selected === "quickpay" ? Number(fee) : 0,
      is_quickpay: selected === "quickpay",
      email: email,
      broker_id: broker._id,
      org_id: orgId
    };
    console.log(payload);

    try {
      await toast.promise(
        addPaymentTerm({ payment_term: payload }),
        {
          loading: "Adding payment term...",
          success: "Payment term added successfully!",
          error: "Failed to add payment term",
        }
      );
      setOpen(false);
    } catch (err) {
      console.error("Failed to add term", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteTerm(termId, org_id) {
    try {
      await toast.promise(
        console.log("Deleting term", termId),
        deletePaymentTerm({ table: "payment_terms", id: termId, orgId: org_id }),
        {
          loading: "Deleting payment term...",
          success: "Payment term deleted successfully!",
          error: "Failed to delete payment term",
        }
      );
    } catch (err) {
      console.error("Failed to delete term", err);
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
                      e.preventDefault();
                      handleAddTerm();
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

                  <Button variant="destructive" size="icon" onClick={() => handleDeleteTerm(agent._id, orgId)}>
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
  );
};

const NotesCard = ({ broker, updateNotes }) => {
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
    setLoading(true)
    try {
      await updateNotes({
        broker_id: broker._id,
        notes: notes
      })
      setOriginalNotes(notes)
      toast.success("Notes saved")
    } catch (e) {
      toast.error("Failed to save: " + e.message)
    } finally {
      setLoading(false)
    }
  }

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

const DocumentsCard = ({ broker, files, orgId }) => {
  const filteredFiles = files;
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Broker Documents</CardTitle>
        <DialogDemo title="Add Document" multiple={true} perFile={true} categories={[
          { value: "CARRIER_AGREEMENT", label: "Carrier Agreement" },
          { value: "QUICKPAY_AGREEMENT", label: "Quickpay Agreement" },
          { value: "MISC", label: "Other" },
        ]} category="MISC" entityType="brokers" entityId={broker._id} expires={false} />

      </CardHeader>
      <CardContent className="space-y-2">
        {!filteredFiles.length ? (
          <p className="text-neutral-500 italic">
            No documents found for broker <span className="font-bold">{broker.name}</span>. Click "Add Document" to upload files related to this broker.
          </p>
        ) : (
          <div className="w-full grid gap-4 grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 px-4">
            {filteredFiles.map((file) => {
              return (
                <DocumentCard
                  key={file._id}
                  file={file}
                />
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};




export default function TablePage({ params }) {
  // Unwrap the params Promise
  const { id } = React.use(params);

  const organization = useQuery(api.organizations.getCurrentOrganization)
  const orgId = organization?._id ? organization._id : "";
  const data = useQuery(api.brokers.byId, { id: id, orgId: orgId });
  const files = useQuery(api.files.byId, { entityId: id, entityType: "brokers", orgId: orgId }) || [];
  const loads = useQuery(api.getTable.allWithIndex, { table: "loads", orgId: orgId, index: "by_brokerId", field: "broker_id", indexValue: id }) || [];
  const updateNotes = useMutation(api.brokers.updateNotes);

  if (!data || data.length === 0) return <ProfileHeader skeleton={true} />

  return (
    <div>
      <ProfileHeader data={data} table="brokers" image_url={data.image_url} name={data.name} description={"USDOT-" + data.usdot_number + " | " + data.docket_number} link={"/directory/" + data.usdot_number} status={data.status} />

      <div className='p-4'>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full h-10">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="agents">Documents</TabsTrigger>
            <TabsTrigger value="loads">Loads</TabsTrigger>
          </TabsList>
          <TabsContent value="info" className="mt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard title="Broker Info" fields={
                  [
                    { label: "Address", value: data.address },
                    { label: "Email", value: data.email },
                    { label: "Phone", value: data.phone },
                    { label: "Website", type: "link", value: data.website },
                  ]

                } />
                <AgentsCard broker={data} />
                <PaymentCard broker={data} orgId={orgId} />
                <NotesCard broker={data} updateNotes={updateNotes} />

              </div>

            </div>
          </TabsContent>
          <TabsContent value="agents" className="mt-2">
            <DocumentsCard broker={data} files={files} orgId={orgId} />
          </TabsContent>
          <TabsContent value="loads" className="mt-2">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <LoadsCard loads={loads} broker={data} />
            </div>
          </TabsContent>
        </Tabs>
      </div>





    </div>
  )
}