"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IconLoader2 } from "@tabler/icons-react";

// Default invoice payload
const defaultInvoice = {
    id: "782",
    date: "2025-08-29T00:00:00.000Z",
    carrier: {
        name: "Three Stars Transport Inc",
        address: "1427 Evanwood Ave",
        address2: "La Puente, California 91744",
        phone: "(619) 939-6319",
        email: "threestars039@gmail.com",
    },
    broker: {
        name: "CH GLOBAL",
        address: "9731 SIEMPRE VIVA RD",
        address2: "San Diego, California 92154",
        phone: "(619) 555-1234",
        email: "broker@example.com",
    },
    adjustments: { quickpayFeePercent: 0, fixedFee: 0 },
    items: [
        {
            description: "Line Haul",
            quantity: 1,
            cost: 2000,
            stops: [
                {
                    type: "Pickup",
                    city: "Sohnen Enterprise - 9043 Siempre Viva Rd, San Diego, CA",
                    zip: "92154",
                    datetime: "2025-08-29T00:00:00.000Z",
                },
                {
                    type: "Delivery",
                    city: "Z & S 26 Electronics, Inc. - 967 E. 11th Street, Los Angeles, CA",
                    zip: "90021",
                    datetime: "2025-08-29T00:00:00.000Z",
                },
            ],
        },
    ],
    color: "134A9E",
    secondaryColor: "134A9E",
};



// Helper function to construct the invoice payload
const constructInvoicePayload = (data) => {
    if (!data) return defaultInvoice;

    return {
        id: data.invoice_number || defaultInvoice.id,
        load_number: data.load_number || "",
        date: data.created_at || new Date().toISOString(),
        carrier: {
            name: "Three Stars Transport Inc",
            address: "1427 Evanwood Ave",
            address2: "La Puente, California 91744",
            phone: "(619) 939-6319",
            email: "threestars039@gmail.com",
        },
        broker: {
            name: data.broker_name || defaultInvoice.broker.name,
            address: data.broker_address_1 || defaultInvoice.broker.address,
            address2: data.broker_address_2 || defaultInvoice.broker.address2,
        },
        adjustments: {
            quickpayFeePercent: data.quickpay_fee_percent ?? defaultInvoice.adjustments.quickpayFeePercent,
            fixedFee: data.fixed_fee ?? defaultInvoice.adjustments.fixedFee,
        },
        items: [
            {
                description: "Line Haul",
                quantity: 1,
                cost: Number(data.rate) || defaultInvoice.items[0].cost,
                stops: Array.isArray(data.stops) && data.stops.length > 0
                    ? data.stops.map((stop) => ({
                        type: stop.type || "Pickup",
                        city: stop.location || "",
                        datetime:
                            stop.appointment_time ||
                            stop.window_start ||
                            new Date().toISOString(),
                    }))
                    : defaultInvoice.items[0].stops,
            },
        ],
        color: data.color || defaultInvoice.color,
        secondaryColor: data.secondaryColor || defaultInvoice.secondaryColor,
    };
};

export default function DownloadInvoiceButton({ data }) {

    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        const payload = constructInvoicePayload(data);

        setLoading(true);


        await toast.promise(
            (async () => {
                const response = await fetch("https://invoice4all.vercel.app/api", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error("Failed to download PDF");

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `invoice-${payload.id}.pdf`;
                document.body.appendChild(a);
                a.click();

                a.remove();
                window.URL.revokeObjectURL(url);

                return true; // resolves successfully
            })(),
            {
                loading: "Generating Invoice...",
                success: "Invoice downloaded!",
                error: (err) => err?.message || "Failed to download PDF",
            }
        );
        await new Promise((resolve) => setTimeout(resolve, 250));

        setLoading(false);
    };

    return (
        <Button onClick={handleDownload} disabled={loading}>
            {loading ? (
                <>
                    <IconLoader2 className="animate-spin" />
                    Downloading...
                </>
            ) : (
                "Download Invoice"
            )}
        </Button>
    );
}
