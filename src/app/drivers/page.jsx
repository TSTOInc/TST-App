import React, { Suspense } from "react";
import InfoGrid from "@/components/data/info-grid";

const brokerSchema = {
  title: "name", // simple key
  description: ["License-", "license_number", " • ", "phone"], // multiple fields combined
  image: "image_url", // single key
  status: item => item.status ?? "UNKNOWN", // function
};


export default function Page() {
  return (
    <Suspense fallback={<InfoGrid skeleton />}>
      <InfoGrid table="drivers" fields={["title", "description", "status"]} schema={brokerSchema} skeleton={false} />
    </Suspense>
  );
}
