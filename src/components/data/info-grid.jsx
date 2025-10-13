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
  const queryData = useQuery(api.getTable.all, { table })

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
    if (skeleton || !queryData) return []
    return queryData.map((item) => ({
      _id: item._id,
      title: resolveSchemaField(schema.title, item, "title"),
      description: resolveSchemaField(schema.description, item, "description"),
      image: resolveSchemaField(schema.image, item, "image"),
      status: resolveSchemaField(schema.status, item, "status"),
      website: resolveSchemaField(schema.website, item, "website"),
      ...item,
    }))
  }, [queryData, schema, skeleton])

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
            <EmptyTitle>No {table} Found</EmptyTitle>
            <EmptyDescription>Create a new {table} to get started.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={`/${table}/add`}>
              <Button variant="outline" size="sm">
                Add {table.slice(0, -1)}
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
