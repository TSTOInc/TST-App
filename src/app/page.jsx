"use client";
import { useEffect, useState } from "react";
import { SectionCards } from "@/components/dashboard/section-cards";

// 🔥 Universal monthly stats calculator
function getPeriodStats(loads, brokers, start, end) {
  const periodLoads = loads.filter((load) => {
    const invoicedAt = load.invoiced_at ? new Date(load.invoiced_at) : null;
    return invoicedAt && invoicedAt >= start && invoicedAt < end && load.paid_at !== null;
  });

  const revenue = periodLoads.reduce((acc, load) => acc + Number(load.rate || 0), 0);
  const periodBrokers = brokers.filter((broker) => {
    const createdAt = broker.created_at ? new Date(broker.created_at) : null;
    return createdAt && createdAt >= start && createdAt < end;
  });

  return {
    revenue: revenue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }),
    brokers: periodBrokers.length,
    loads: periodLoads.length,
  };
}


const Home = () => {
  const [stats, setStats] = useState({
    last30Days: { revenue: "$0", brokers: 0, loads: 0 },
    prev30Days: { revenue: "$0", brokers: 0, loads: 0 },
  });

  useEffect(() => {
    async function fetchLoads() {
      try {
        const loadRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/loads`);
        const loadData = await loadRes.json();
        const brokerRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/brokers`);
        const brokerData = await brokerRes.json();

        const now = new Date();

        // Last 30 days
        const last30Start = new Date(now);
        last30Start.setDate(now.getDate() - 30);

        const last30Days = getPeriodStats(loadData, brokerData, last30Start, now);

        // Previous 30 days (31–60 days ago)
        const prev30End = new Date(last30Start); // end is 30 days ago
        const prev30Start = new Date(now);
        prev30Start.setDate(now.getDate() - 60);

        const prev30Days = getPeriodStats(loadData, brokerData, prev30Start, prev30End);

        setStats({ last30Days, prev30Days });
      } catch (err) {
        console.error("Failed to fetch loads", err);
      }
    }

    fetchLoads();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Pass structured stats to your component */}
          <SectionCards stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default Home;
