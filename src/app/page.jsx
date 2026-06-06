"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs'
import { SectionCards } from "@/components/dashboard/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

// Import global formatting engine
import { formatCentsToUSD } from "@/lib/currency";

function getPeriodStats(loads, brokers, start, end) {
  const payedPeriodLoads = loads.filter((load) => {
    const invoicedAt = load.paid_at ? new Date(load.paid_at) : null;
    return invoicedAt && invoicedAt >= start && invoicedAt < end && load.paid_at;
  });

  const periodLoads = loads.filter((load) => {
    const createdAt = load._creationTime ? new Date(load._creationTime) : null;
    return createdAt && createdAt >= start && createdAt < end;
  });

  // Accumulate the flat raw cent values
  const revenueCents = payedPeriodLoads.reduce(
    (acc, load) => acc + Number(load.rate || 0),
    0
  );

  const periodBrokers = brokers.filter((broker) => {
    const createdAt = broker._creationTime ? new Date(broker._creationTime) : null;
    return createdAt && createdAt >= start && createdAt < end;
  });

  return {
    // Format safely using global configuration
    revenue: formatCentsToUSD(revenueCents),
    brokers: periodBrokers.length,
    loads: periodLoads.length,
  };
}

const Home = () => {
  const pathname = usePathname() ?? "";
  const path = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

  // Check auth status
  const { has } = useAuth();

  const loads = useQuery(api.getTable.all, has ? { table: "loads"} : "skip");
  const brokers = useQuery(api.getTable.all, has ? { table: "brokers"} : "skip");

  const [stats, setStats] = useState({
    last30Days: { revenue: "$0.00", brokers: 0, loads: 0 },
    prev30Days: { revenue: "$0.00", brokers: 0, loads: 0 },
  });

  const [chartRevenueData, setChartRevenueData] = useState([]);
  const [chartLoadsData, setChartLoadsData] = useState([]);

  useEffect(() => {
    if (!loads || !brokers) return;

    const now = new Date();

    // --- 📊 Stats ---
    const last30Start = new Date(now);
    last30Start.setDate(now.getDate() - 30);

    const last30Days = getPeriodStats(loads, brokers, last30Start, now);

    const prev30End = new Date(last30Start);
    const prev30Start = new Date(now);
    prev30Start.setDate(now.getDate() - 60);

    const prev30Days = getPeriodStats(loads, brokers, prev30Start, prev30End);

    // --- 📆 90-Day Charts ---
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 89);

    const dailyRevenueMap = {};
    const dailyLoadsMap = {};

    for (
      let d = new Date(startDate);
      d <= now;
      d = new Date(d.getTime() + 86400000)
    ) {
      const key = d.toISOString().split("T")[0];
      dailyRevenueMap[key] = 0;
      dailyLoadsMap[key] = 0;
    }

    // 💰 Revenue by paid_at (Aggregated securely in integer cent space)
    for (const load of loads) {
      if (load.paid_at && load.rate) {
        const key = new Date(load.paid_at).toISOString().split("T")[0];
        if (dailyRevenueMap[key] !== undefined) {
          dailyRevenueMap[key] += Number(load.rate);
        }
      }
    }

    // 🚚 Loads by created_at
    for (const load of loads) {
      if (load._creationTime) {
        const key = new Date(load._creationTime).toISOString().split("T")[0];
        if (dailyLoadsMap[key] !== undefined) {
          dailyLoadsMap[key] += 1;
        }
      }
    }

    setStats({ last30Days, prev30Days });

    setChartRevenueData(
      Object.entries(dailyRevenueMap).map(([date, revenueCents]) => ({
        date,
        // Convert integer cents to a standard float format ($) for linear charts
        revenue: revenueCents / 100,
      }))
    );

    setChartLoadsData(
      Object.entries(dailyLoadsMap).map(([date, loadsCount]) => ({
        date,
        loads: loadsCount,
      }))
    );
  }, [loads, brokers]);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={stats} />
          <div className="px-4 lg:px-6 space-y-4">
            <ChartAreaInteractive
              title="Revenue"
              chartData={chartRevenueData}
            />
            <ChartAreaInteractive
              title="Loads"
              chartData={chartLoadsData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;