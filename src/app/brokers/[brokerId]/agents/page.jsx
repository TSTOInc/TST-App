"use client"
import React, { useEffect, useState } from "react"
import CompanyCard from "../../../../components/custom/company-card"

const Page = ({ params }) => {
  const { brokerId } = React.use(params)
  const [brokers, setBrokers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBrokers = async () => {
      try {
        const res = await fetch("https://tst.api.incashy.com/get/brokers_agents")
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

  if (loading) return <main className="flex flex-col justify-center items-center h-full text-center p-8 flex-grow">
        <h1 className="text-6xl lg:text-8xl font-bold mb-4">Loading...</h1>
        <p className="text-xl mb-8">Fetching data for <b>Broker Agents</b>...</p>
        </main>
  if (error) return <div>Error: {error}</div>

  // Filter to only keep agents with matching brokerId
  const filteredBrokers = brokers
    .filter(agent => String(agent.broker_id) === String(brokerId))
    .map(({ created_at, updated_at, ...rest }) => rest)

  if (filteredBrokers.length === 0)
    return <div>No broker agents available for this broker.</div>

  return (
    <div className="p-4">
      <h2 className="text-2xl mb-4">Broker Agents for <span className="font-bold">{filteredBrokers[0].broker.name}:</span></h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {filteredBrokers.map(agent => (
          <CompanyCard agent key={agent.id} company={agent} />
        ))}
      </div>
    </div>
  )
}

export default Page
