"use client"

import React, { useState, useMemo } from "react"
import CompanyCard from "@/components/custom/company-card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconZoomQuestion, IconAlertCircle } from "@tabler/icons-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { usePathname } from 'next/navigation'
import { useOrganization } from "@clerk/nextjs"


const EQUIPMENT_TYPE_LABELS = {
  reefer: "Reefer",
  dry_van: "Dry Van",
  flatbed: "Flatbed",
  step_deck: "Step Deck",
  double_drop: "Double Drop",
  lowboy: "Lowboy",
  conestoga: "Conestoga",
  tank: "Tank",
  container_chassis: "Container Chassis",
  power_only: "Power Only",
  extendable_flatbed: "Extendable Flatbed",
  gooseneck: "Gooseneck",
  side_kit_flatbed: "Side Kit Flatbed",
  dump_trailer: "Dump Trailer",
  auto_carrier: "Auto Carrier",
  hot_shot: "Hot Shot",
  livestock_trailer: "Livestock Trailer",
  vacuum_trailer: "Vacuum Trailer",
  car_flatbed: "Car Flatbed",
  platform: "Platform",
  box_trailer: "Box Trailer",
  curtain_side: "Curtain Side",
  coil_carrier: "Coil Carrier",
};
const formatEquipmentType = function (equipmentType) {
  if (!equipmentType) return "Unknown";
  return EQUIPMENT_TYPE_LABELS[equipmentType] ?? equipmentType.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}








// --- Helper: safely get nested values ---
function getValue(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj)
}

// --- Helper: resolve schema fields ---
function resolveSchemaField(schemaField, item, key) {
  if (typeof schemaField === "function") return schemaField(item)

  const isImageField = key === "image"

  if (Array.isArray(schemaField)) {
    return isImageField
      ? getValue(item, schemaField[0]) || ""
      : schemaField.map((part) => getValue(item, part) ?? part).join(" ")
  }

  if (typeof schemaField === "string") {
    const val = getValue(item, schemaField)
    if (key === "website") return val ?? null
    return val ?? (isImageField ? "" : schemaField)
  }

  return ""
}

export default function InfoGrid({
  table,
  schema = {},
  skeleton = false,
  fields = [],
  error = null,
  onRetry,
}) {

  const { organization } = useOrganization();
  const pathname = usePathname() ?? "";
  const path = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname


  const queryData = useQuery(api.getTable.all, organization ? { table, orgId: organization.id } : "skip")

  const [searchQuery, setSearchQuery] = useState("")

  // --- Show error state ---
  if (error) {
    return (
      <div className="p-4">
        <Empty className="border border-red-400">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconAlertCircle />
            </EmptyMedia>
            <EmptyTitle>Error loading {table}</EmptyTitle>
            <EmptyDescription>{error.message || "Something went wrong"}</EmptyDescription>
          </EmptyHeader>
          {onRetry && (
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={onRetry}>
                Retry
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </div>
    )
  }

  // --- Map raw data using schema ---
  const mappedData = useMemo(() => {
    if (skeleton || !queryData) return [];

    return queryData.map((item) => {
      let description;

      if (table === "equipment") {
        const length = item.equipment_length;
        const type = formatEquipmentType(item.equipment_type);

        description = `${length}ft ${type}`;
      } else {
        description = resolveSchemaField(
          schema.description,
          item,
          "description"
        );
      }

      return {
        _id: item._id,
        title: resolveSchemaField(schema.title, item, "title"),
        description,
        image: resolveSchemaField(schema.image, item, "image"),
        status: resolveSchemaField(schema.status, item, "status"),
        website: resolveSchemaField(schema.website, item, "website"),
        ...item,
      };
    });
  }, [queryData, schema, skeleton, table]);




  const searchFields = fields.length ? fields : ["title", "description"]

  const filteredData = useMemo(() => {
    if (skeleton || !queryData) return []
    return mappedData.filter((item) =>
      searchFields.some((field) =>
        item[field]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }, [mappedData, searchFields, searchQuery, skeleton, queryData])

  return (
    <div className="p-4 space-y-4">
      <SearchBar
        skeleton={skeleton || !queryData}
        value={searchQuery}
        onValueChange={setSearchQuery}
        placeholder={`Search ${table}...`}
      />

      {(skeleton || !queryData) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CompanyCard key={i} skeleton />
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconZoomQuestion />
            </EmptyMedia>
            <EmptyTitle>No {table.replace(/_/g, ' ')} Found</EmptyTitle>
            <EmptyDescription>Create a new {table.replace(/_/g, ' ').replace(/s/g, '')} to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={`${path}/add`}>
              <Button variant="outline" size="sm">
                {/* We are replacing the underscore with a space and the 's' with an empty string */}
                Add {table.replace(/_/g, ' ').replace(/s/g, '')}
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredData.map((item) => (
            <CompanyCard
              key={item._id}
              id={item._id}
              table={table}
              title={item.title}
              description={item.description}
              image={item.image}
              status={item.status}
              website={item.website}
            />
          ))}
        </div>
      )}
    </div>
  )
}
