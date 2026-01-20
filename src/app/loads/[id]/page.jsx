"use client";
import React, { useEffect, useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { FileText, DollarSign, Package, Building2, NotepadText, MapPin, ArrowUpFromLine, ArrowDownToLine, FileSearch, FileTextIcon, Unplug, } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useOrganization } from '@clerk/nextjs'
import TimelineVertical from "@/components/TimelineVertical"
import TruckRouteMap from "@/components/custom/TruckRouteMap"
import InfoCard from '@/components/data/info-card'
import LoadProgressCard from '@/components/layout/LoadProgressCard'
import { IconFileDollar, IconUsersGroup } from "@tabler/icons-react";

// ---------------------- HELPERS ----------------------
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

const formatDate = (dateStr) =>
  dateStr
    ? new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

const formatDueDate = (invoiceDateStr, daysToPay, paid_at) => {
  if (!invoiceDateStr || typeof daysToPay !== "number") return "";
  const invoiceDate = new Date(invoiceDateStr);
  if (isNaN(invoiceDate)) return "";
  const dueDate = new Date(invoiceDate);
  dueDate.setDate(invoiceDate.getDate() + daysToPay);

  const diffDays = Math.ceil((dueDate.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
  if (paid_at !== null) return "PAID";
  if (diffDays === 0) return "DUE TODAY";
  if (diffDays < 0) return `OVERDUE BY ${Math.abs(diffDays)} DAY${Math.abs(diffDays) !== 1 ? "S" : ""}`;
  return `DUE IN ${diffDays} DAY${diffDays !== 1 ? "S" : ""}`;
};

const geocodeAddress = async (address) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Geocoding failed")
  const data = await res.json()
  if (data.features && data.features.length > 0) return data.features[0].geometry.coordinates
  throw new Error(`Could not geocode address: ${address}`)
}

// ---------------------- COMPONENTS ----------------------
const ComplexCard = ({ title, icon: Icon, value }) => (
  <Card>
    <CardHeader className="flex justify-between pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const RateCard = ({ rate, feePercent, invoicedAt, paymentTerms, paid_at }) => {
  const netRate = useMemo(() => rate - rate * (feePercent / 100), [rate, feePercent]);
  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex justify-between pb-2">
        <CardTitle className="text-sm font-medium">Rate</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold text-green-500">{currencyFormatter.format(netRate)}</span>
          <span className="text-xl font-medium text-blue-400">
            {formatDueDate(invoicedAt, paymentTerms.days_to_pay, paid_at)}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Base Rate:</span>
            <span className="text-xs font-medium">{currencyFormatter.format(rate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Quick Pay ({feePercent}%):</span>
            <span className="text-xs font-medium text-red-500">
              -{currencyFormatter.format(rate * (feePercent / 100))}
            </span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium">Total:</span>
            <span className="text-xs font-bold text-green-500">{currencyFormatter.format(netRate)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Payment Terms:</span>
            <span className="text-xs font-medium">{paymentTerms.name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------------------- MAIN PAGE ----------------------
export default function HomePage({ params }) {
  const { id } = React.use(params);
  const { organization } = useOrganization();
  const orgId = organization?.id || "";
  const data = useQuery(api.loads.byId, { id, orgId });
  console.log(data)

  const sortedStops = useMemo(() => {
    if (!data?.stops) return [];
    return [...data.stops].sort((a, b) => {
      const timeA = a.appointment_time ? new Date(a.appointment_time) : new Date(a.window_end);
      const timeB = b.appointment_time ? new Date(b.appointment_time) : new Date(b.window_end);
      return timeA - timeB;
    });
  }, [data?.stops]);

  const timelineStops = useMemo(() => {
    if (!sortedStops.length) return [];

    return sortedStops.map((stop, index) => ({
      id: index + 1,
      title:
        stop.type === "pickup"
          ? "Pickup"
          : stop.type === "delivery"
            ? "Delivery"
            : "Stop",
      description: stop.location,
      date: stop.appointment_time
        ? formatDate(stop.appointment_time)
        : formatTimeRange(stop.window_start, stop.window_end),
      icon:
        stop.type === "pickup"
          ? ArrowUpFromLine
          : stop.type === "delivery"
            ? ArrowDownToLine
            : MapPin,
    }));
  }, [sortedStops]);

  const [stopsWithCoords, setStopsWithCoords] = useState([]);

  useEffect(() => {
    if (!sortedStops.length) return;

    const fetchStops = async () => {
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
      setStopsWithCoords(stopsWithCoordinates);
    };
    fetchStops();
  }, [sortedStops]);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <ComplexCard title="Load Number" icon={FileText} value={`#${data.load_number}`} />
          <ComplexCard title="Invoice Number" icon={DollarSign} value={`#${data.invoice_number}`} />
        </div>
        <RateCard
          rate={Number.parseFloat(data.rate)}
          feePercent={data.payment_terms.fee_percent}
          invoicedAt={data.invoiced_at}
          paymentTerms={data.payment_terms}
          paid_at={data.paid_at}
        />
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="w-full h-10">
          <TabsTrigger value="details"><FileSearch className="h-4 w-4"/>Details</TabsTrigger>
          <TabsTrigger value="parties"><Unplug className="h-4 w-4"/>Parties</TabsTrigger>
          <TabsTrigger value="documents"><FileTextIcon className="h-4 w-4"/>Documents</TabsTrigger>
          <TabsTrigger value="timeline"><IconFileDollar className="h-4 w-4"/>Invoice</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          {/* Load Info */}
          <LoadProgressCard data={data} />
          <div className="grid gap-4 md:grid-cols-2">

            <InfoCard
              CardIcon={<Package className="h-5 w-5" />}
              title="Load Information"
              inline={false}
              fields={[
                { label: "COMMODITY", value: data.commodity },
                { label: "LOAD TYPE", value: data.load_type },
                { label: "LENGTH FT", value: data.length_ft },
                { label: "CREATED AT", value: data._creationTime, type: "date" },
              ]}
            />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <NotepadText className="h-5 w-5" /> Special Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={data.instructions || ""} readOnly rows={6} placeholder="Notes..." />
              </CardContent>
            </Card>
          </div>

          {/* Route Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Route Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TimelineVertical items={timelineStops} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Route Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stopsWithCoords.length > 0 ? (
                  <TruckRouteMap stops={stopsWithCoords} progress={0} />
                ) : (
                  <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-center space-y-2">
                    <MapPin className="h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Interactive map will be displayed here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="parties" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <InfoCard
              CardIcon={<Building2 className="h-5 w-5" />}
              title="Broker Information"
              inline={false}
              fields={[
                { label: "Name", value: data.broker.name, type: "link", href: `/brokers/${data.broker._id}`, external: false },
                { label: "Address", value: data.broker.address + ", " + data.broker.address_2 },
                { label: "Agent", value: data?.broker_agent?.name || "No Agent" },
              ]}
            />
            <InfoCard
              CardIcon={<Package className="h-5 w-5" />}
              title="Equipment Information"
              inline={false}
              fields={[
                {
                  label: "Truck",
                  value: data.truck.truck_number,
                  type: "link",
                  href: `/trucks/${data.truck._id}`,
                  external: false
                },
                {
                  label: "Equipment",
                  value: data.equipment?.equipment_number || "No Equipment",
                  type: data.equipment ? "link" : "text",
                  href: data.equipment ? `/equipment/${data.equipment._id}` : undefined,
                  external: false
                },
              ]}
            />


          </div>
        </TabsContent>









        <TabsContent value="documents" className="space-y-4">
          Docs
        </TabsContent>
      </Tabs>
    </div>
  );
}
