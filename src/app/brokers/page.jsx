import React, { Suspense } from "react";
import InfoGrid from "@/components/data/info-grid";

const brokerSchema = {
  title: "name", // simple key
  description: ["DOT-","usdot_number"," • ","docket_number"], // multiple fields combined
  image: "image_url", // single key
  status: item => item.status ?? "UNKNOWN", // function
  website: "website",
};


export default function Page() {
  return (
    <Suspense fallback={<InfoGrid skeleton />}>
      <InfoGrid table="brokers" fields={["title", "description", "status"]} schema={brokerSchema} skeleton={false} />
    </Suspense>
  );
}
