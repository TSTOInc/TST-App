import React, { Suspense } from "react";
import InfoGrid from "@/components/data/info-grid";

const truckSchema = {
  title: "truck_number", // simple key
  description: ["make", "model", "year"], // multiple fields combined
  image: "image_url", // single key
  status: item => item.status ?? "UNKNOWN", // function
};


export default function Page() {
  return (
    <Suspense fallback={<InfoGrid skeleton />}>
      <InfoGrid table="trucks" fields={["title", "description", "status"]} schema={truckSchema} skeleton={false} />
    </Suspense>
  );
}
