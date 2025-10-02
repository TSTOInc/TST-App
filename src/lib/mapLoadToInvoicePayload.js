export default function mapLoadToInvoicePayload(load) {
    return {
        id: load.invoice_number || load.id,
        load_number: load.load_number,
        date: load.invoiced_at || load.created_at, // fallback to created_at
        carrier: {
            name: "Three Stars Transport Inc",
            address: "1427 Evanwood Ave",
            address2: "La Puente, California 91744",
            phone: "(619) 939-6319",
            email: "threestars039@gmail.com",
        },
        broker: {
            name: load.broker?.name || "N/A",
            address: load.broker?.address_1 || "",
            address2: load.broker?.address_2 || "",
            phone: load.broker?.phone || "",
            email: load.broker?.email || "",
        },
        adjustments: {
            quickpayFeePercent: load.payment_terms?.fee_percent || 0,
            fixedFee: 0,
        },
        items: [{
            description: "Line Haul",
            notes: `Truck# ${load.truck?.truck_number || ""}, Trailer# ${load.equipment?.equipment_number || ""}`,
            quantity: 1,
            cost: Number(load.rate) || 0,
            stops: load.stops
                ?.filter((s) => ["pickup", "delivery"].includes(s.type.toLowerCase()))
                .map((s, idx) => ({
                    type: (idx + 1) + ".- " + s.type.charAt(0).toUpperCase() + s.type.slice(1),
                    city: s.location.split(",")[0],
                    zip: s.location.split(" ").slice(-1)[0] || "",
                    datetime: s.window_start || "",
                })),
        }] || [],
        color: "134A9E",
        secondaryColor: "134A9E",
    }
}