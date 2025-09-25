"use client"

import { FC, useState } from "react"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { IconFilter } from "@tabler/icons-react"
import { Card } from "@/components/ui/card"

interface Filters {
  status: string
  minRate: string
  maxRate: string
  loadType: string
  dateRange: string
}

interface FiltersToolbarProps {
  filters: Filters
  setFilters: (filters: Filters) => void
  onClear: () => void
}

const FiltersToolbar: FC<FiltersToolbarProps> = ({ filters, setFilters, onClear }) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="w-full">
      {/* Collapsible Button for Mobile */}
      <div className="sm:hidden flex justify-end mb-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <IconFilter size={16} />
          Filters
        </Button>
      </div>

      {/* Filters Panel */}
      <Card
        className={`w-full p-4
        ${isOpen ? "flex flex-col" : "hidden"} 
        sm:flex sm:flex-row sm:items-center sm:gap-4 sm:flex-wrap
        `}
      >
        {/* Status */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label>Status</Label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="at_pickup">At Pickup</SelectItem>
              <SelectItem value="in_transit">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="invoiced">Invoiced</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Load Type */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label>Load Type</Label>
          <Select
            value={filters.loadType || "all"}
            onValueChange={(value) => setFilters({ ...filters, loadType: value === "all" ? "" : value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="FTL">FTL</SelectItem>
              <SelectItem value="LTL">LTL</SelectItem>
              <SelectItem value="PowerOnly">Power Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rate */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label>Rate $</Label>
          <div className="flex gap-1">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minRate}
              onChange={(e) => setFilters({ ...filters, minRate: e.target.value })}
              className="w-20"
            />
            <span className="flex items-center text-muted-foreground">–</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxRate}
              onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
              className="w-20"
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Label>Date</Label>
          <Select
            value={filters.dateRange || "all"}
            onValueChange={(value) => setFilters({ ...filters, dateRange: value === "all" ? "" : value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Any date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="last_7">Last 7 days</SelectItem>
              <SelectItem value="last_30">Last 30 days</SelectItem>
              <SelectItem value="this_month">This month</SelectItem>
              <SelectItem value="last_month">Last month</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear */}
        <Button
          variant="outline"
          size="sm"
          className="self-start sm:self-auto mt-2 sm:mt-0"
          onClick={onClear}
        >
          Clear All
        </Button>
      </Card>
    </div>
  )
}

export default FiltersToolbar
