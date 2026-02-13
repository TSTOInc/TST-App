"use client"

import { useState } from "react"
import { ArrowRightIcon, ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function prettyFieldName(key, upperCase = true) {
    if (upperCase) return key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())

    return key.replace(/_/g, " ")
    
}

function formatValue(value) {
    if (value === null || value === undefined) return "—"
    if (typeof value === "boolean") return value ? "Yes" : "No"
    return String(value)
}


function getChangedFields(before = {}, after = {}) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])

    return Array.from(keys).filter(
        (key) => before?.[key] !== after?.[key]
    )
}
function getRecordDisplayValue(table, record) {
    if (!record) return "Unknown record"

    const map = {
        equipment: "equipment_number",
        trucks: "truck_number",
        drivers: "name",
        brokers: "name",
        loads: "invoice_number",
        broker_agents: "name",
    }

    const field = map[table]

    if (field && record[field]) {
        return record[field]
    }

    // fallback strategy
    if (record.name) return record.name
    if (record.title) return record.title
    if (record.number) return record.number

    return record._id || ""
}

function singularize(table) {
  if (table.endsWith("ies")) {
    // carriers -> carrier
    return table.slice(0, -3) + "y";
  }

  if (table.endsWith("ses")) {
    // statuses -> status
    return table.slice(0, -2);
  }

  if (table.endsWith("s") && !table.endsWith("ss")) {
    // loads -> load
    // drivers -> driver
    return table.slice(0, -1);
  }

  return table;
}

function generatePrimaryMessage(log) {
    const user = log.user.first_name ? `${log.user.first_name} ${log.user.last_name}` : log.performed_by
    const entityName = singularize(prettyFieldName(log.table, false));
    const entity = `the ${entityName}: ${getRecordDisplayValue(log.table, log.after) ?? ""}`.trim()

    if (log.action === "create") {
        return `${user} created ${entity}`
    }

    if (log.action === "delete") {
        return `${user} deleted ${entity}`
    }

    if (log.action === "update") {
        const changed = getChangedFields(log.before, log.after)

        if (changed.length === 1) {
            const field = changed[0]
            return `${user} updated ${prettyFieldName(field)}`
        }

        if (changed.length > 1) {
            return `${user} updated ${entity} (${changed.length} changes)`
        }

        return `${user} updated ${entity}`
    }

    return "Activity recorded"
}

export function AuditLogItem({ log }) {
    const [open, setOpen] = useState(false)

    const changedFields =
        log.action === "update"
            ? getChangedFields(log.before, log.after)
            : []

    return (
        <div className="border rounded-xl transition-colors">
            {/* Header */}
            <div
                className={`flex p-4 items-start justify-between cursor-pointer hover:bg-muted/40 ${open ? "rounded-t-xl" : "rounded-xl"}`}
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-4">
                    <Avatar>
                        <AvatarImage src={log.user.image_url} />
                        <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-medium">
                            {generatePrimaryMessage(log)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {new Date(Math.floor(log._creationTime)).toLocaleString()}
                        </p>
                    </div>
                    <div className="mt-1">
                        {open ? (
                            <ChevronDown size={16} />
                        ) : (
                            <ChevronRight size={16} />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {open && (
                <div className="p-6 pt-2 space-y-2 text-sm border-t-2">
                    {/* CREATE */}
                    {log.action === "create" &&
                        Object.entries(log.after || {}).map(([key, value]) => (
                            <div key={key}>
                                <span className="font-medium">
                                    {prettyFieldName(key)}:
                                </span>{" "}
                                {formatValue(value)}
                            </div>
                        ))}

                    {/* UPDATE */}
                    {log.action === "update" &&
                        changedFields.map((field) => (
                            <div key={field}>
                                <span className="font-medium">
                                    {prettyFieldName(field)}:
                                </span>{" "}
                                {formatValue(log.before?.[field])}
                                <ArrowRightIcon className="inline mx-1.5" size={14} strokeWidth={3} />
                                {formatValue(log.after?.[field])}
                            </div>
                        ))}

                    {/* DELETE */}
                    {log.action === "delete" &&
                        Object.entries(log.before || {}).map(([key, value]) => (
                            <div key={key}>
                                <span className="font-medium">
                                    {prettyFieldName(key)}:
                                </span>{" "}
                                {formatValue(value)}
                            </div>
                        ))}
                </div>
            )}
        </div>
    )
}
