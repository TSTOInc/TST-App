"use client";
import { useEffect, useState } from "react";
import { SectionCards } from "@/components/dashboard/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";

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
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const loadRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/loads`);
        const loads = await loadRes.json();
        const brokerRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/brokers`);
        const brokers = await brokerRes.json();

        const now = new Date();

        // --- 📊 Stats Calculations ---
        const last30Start = new Date(now);
        last30Start.setDate(now.getDate() - 30);
        const last30Days = getPeriodStats(loads, brokers, last30Start, now);

        const prev30End = new Date(last30Start);
        const prev30Start = new Date(now);
        prev30Start.setDate(now.getDate() - 60);
        const prev30Days = getPeriodStats(loads, brokers, prev30Start, prev30End);

        // --- 📆 Build 90-Day Chart Data ---
        const startDate = new Date(now);
        startDate.setDate(now.getDate() - 89); // last 90 days including today

        const dailyMap = {};
        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().split("T")[0];
          dailyMap[key] = 0;
        }

        // Sum revenue per day using `paid_at`
        for (const load of loads) {
          if (load.paid_at && load.rate) {
            const paidDate = new Date(load.paid_at);
            const key = paidDate.toISOString().split("T")[0];
            if (dailyMap[key] !== undefined) {
              dailyMap[key] += Number(load.rate);
            }
          }
        }

        const chartArray = Object.entries(dailyMap).map(([date, revenue]) => ({
          date,
          revenue, // keep consistent with your ChartAreaInteractive keys
        }));

        setStats({ last30Days, prev30Days });
        setChartData(chartArray);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards stats={stats} />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive chartData={chartData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
