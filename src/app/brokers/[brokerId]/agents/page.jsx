"use client"
import React, { useEffect, useState } from "react"
import CompanyCard from "../../../../components/custom/company-card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { IconZoomQuestion } from "@tabler/icons-react"
import { SearchBar } from "@/components/search-bar"

const Page = ({ params }) => {
  const { brokerId } = React.use(params)
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const res = await fetch(`/api/get/brokers_agents`)
        if (!res.ok) throw new Error("Failed to fetch brokers agents")
        const data = await res.json()
        setBrokers(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchBrokers()
  }, [])

  // Filter to only keep agents with matching brokerId
  const filteredBrokers = brokers
    .filter(agent => String(agent.broker_id) === String(brokerId))
    .map(({ created_at, updated_at, ...rest }) => rest)

  const filteredData = filteredBrokers.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <SearchBar skeleton={loading} value={searchQuery} onValueChange={setSearchQuery} placeholder="Search items..." />
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CompanyCard key={i} skeleton />
          ))}
        </div>
      ) : error ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconZoomQuestion />
            </EmptyMedia>
            <EmptyTitle>Error Loading Broker Agents</EmptyTitle>
            <EmptyDescription>{error}</EmptyDescription>
            <EmptyDescription>
              Need help? <a href="#">Contact support</a>
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : filteredBrokers.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconZoomQuestion />
            </EmptyMedia>
            <EmptyTitle>No Broker Agents Found</EmptyTitle>
            <EmptyDescription>
              Create a new broker to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href="/brokers/agents">
              <Button variant="outline" size="sm">
                See All Brokers Agents
              </Button>
            </Link>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {filteredBrokers.map(agent => (
            <CompanyCard agent key={agent.id} company={agent} />
          ))}
        </div>
      )}

    </div>
  )
}

export default Page
