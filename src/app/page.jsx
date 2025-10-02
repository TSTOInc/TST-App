"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

import { SectionCards } from "@/components/dashboard/section-cards"




function sumLastMonthRates(loads) {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const total = loads
    .filter((load) => {
      const deliveredAt = new Date(load.invoiced_at);
      return deliveredAt >= lastMonth && deliveredAt < thisMonth && load.paid_at !== null;
    })
    .reduce((acc, load) => {
      // Make sure rate is a number
      return acc + Number(load.rate || 0);
    }, 0);

  // Format as currency
  return total.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });
}



const Home = () => {
  const [revenue, setRevenue] = useState("$0");
  useEffect(() => {
    async function fetchLoads() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/loads`); // adjust URL as needed
        const data = await res.json();

        const total = sumLastMonthRates(data);
        setRevenue(total);
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
          <SectionCards revenue={revenue} />
        </div>
      </div>
    </div>
  );
}

export default Home