"use client";
"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { IconMapPin, IconEye, IconZoomQuestion, IconLoader2 } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SearchBar from "@/components/ui/search-bar"
import { useSearchParams, useRouter } from "next/navigation"
import FiltersToolbar from "@/components/ui/filters-toolbar"
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { useOrganization } from "@clerk/nextjs"


const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

export function formatRate(value) {
    const num = Number(value)
    if (isNaN(num)) return "0.00"
    return num.toFixed(2)
}

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

const formatCityState = (address) => {
    if (!address) return "N/A"
    const parts = address.split(",").map((p) => p.trim())
    if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`
    return address
}

const formatDueDate = (invoiceDateStr, daysToPay, paidDateStr) => {
    if (!invoiceDateStr || !daysToPay) {
        return { text: "IN PROGRESS", color: "text-muted-foreground font-semibold dark:font-normal" }
    }

    const invoiceDate = new Date(invoiceDateStr)
    const dueDate = new Date(invoiceDate)
    dueDate.setDate(invoiceDate.getDate() + daysToPay)

    const now = new Date()
    const diffTime = dueDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (paidDateStr) return { text: "PAID", color: "text-green-500 font-semibold dark:font-normal" }
    if (diffDays === 0) return { text: "DUE TODAY", color: "text-blue-400 font-semibold dark:font-normal" }
    if (diffDays < 0) {
        return {
            text: `OVERDUE BY ${Math.abs(diffDays)} DAY${Math.abs(diffDays) > 1 ? "S" : ""}`,
            color: "text-red-500 font-semibold dark:font-normal",
        }
    }
    return {
        text: `DUE IN ${diffDays} DAY${diffDays > 1 ? "S" : ""}`,
        color: "text-blue-400 font-semibold dark:font-normal",
    }
}










export function LoadCard({ load }) {

    const status = formatDueDate(load.invoiced_at, load.payment_days_to_pay, load.paid_at)

    return (
        <Card
            key={load._id}
            className="hover:bg-muted/50 transition py-5 px-4"
        >
            <div className="flex c w-full">
                {/* LEFT SIDE */}
                <div className="flex-1 pr-6 bg-">
                    <div className="font-semibold text-lg flex pr-4">
                        <span>
                            {load.broker_name || "N/A"}
                            <Badge status={load.load_status} className="ml-2 capitalize">
                                {load.load_status || "new"}
                            </Badge>
                        </span>
                    </div>

                    <span className="text-muted-foreground text-sm">
                        {load.invoice_number || "N/A"} • {load.load_number || "N/A"}
                    </span>

                    <div className="flex items-center space-x-2 mt-1">
                        <IconMapPin size={16} />
                        <span>{formatCityState(load.stops?.[0]?.location) || "N/A"}</span>
                        <span className="text-gray-400">→</span>
                        <span>{formatCityState(load.stops?.[load.stops.length - 1]?.location) || "N/A"}</span>
                    </div>

                    <div className={`text-md ${status.color}`}>{status.text}</div>
                </div>

                {/* RIGHT SIDE (auto width) */}
                <div className="flex flex-col items-end w-fit pl-4">
                    <span className="font-semibold text-xl w-full text-center">${formatRate(load.rate)}</span>

                    <div className="flex-1" /> {/* pushes button down */}

                    <Button variant="outline" className="px-8 py-2 mt-2" asChild>
                        <Link href={`/loads/${load._id}`} className="flex items-center">
                            <IconEye className="mr-2" />
                            View Load
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>
    )
}