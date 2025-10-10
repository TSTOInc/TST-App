"use client"

import React, { useEffect, useState } from 'react'
import CompanyCard from "@/components/custom/company-card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { IconZoomQuestion } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/search-bar"

export default function InfoGridUI({ table, data, skeleton, fields = [] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const filteredData = data.filter(item =>
    fields.some(field => {
      const value = item[field];
      return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase());
    })
  );
  return (
    <div className="p-4 space-y-4">
      <SearchBar skeleton={skeleton} value={searchQuery} onValueChange={setSearchQuery} placeholder={`Search...`} />
      {skeleton ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
            <EmptyDescription>
              Create a new {table} to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={`/${table}/add`}>
              <Button variant="outline" size="sm">
                Add Truck
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredData.map(item => (
            <CompanyCard key={item.id} id={item.id} table={table} title={item.title} description={item.description} image={item.image} status={item.status} website={item.website} />
          ))}
        </div>
      )}
    </div>
  );
}
