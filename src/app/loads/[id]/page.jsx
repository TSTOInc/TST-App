import { LoadDetailsPage } from "@/components/custom/load-details-page"
import React from "react"

// Sample load data - in a real app, this would come from your API/database
const sampleLoadData = {
  id: "fddd18af-a667-4c2c-8b50-091b0f375a95",
  load_number: "76672",
  invoice_number: "783",
  load_status: "invoiced",
  commodity: "Remelt Brass Metal",
  load_type: "FTL",
  length_ft: 53,
  rate: "400.00",
  payment_terms_id: "932e1499-9626-4167-bd15-19368f36f7b2",
  broker_id: "e07b6115-0482-4477-b75d-48ed034f8ee7",
  agent_id: null,
  truck_id: "9f36c2e1-b4f2-47d0-9872-5e45c6f5bdd5",
  equipment_id: "1a86bc42-9a8b-493b-96a9-0e8ecd3887d5",
  instructions: null,
  created_at: "2025-09-17T00:40:15.465Z",
  updated_at: "2025-09-17T00:40:15.465Z",
  invoiced_at: "2025-09-16T07:00:00.000Z",
  broker_name: "DIAMOND LOGISTICS LP",
  broker_address_1: "9400 S. DE WOLF AVE, SELMA , CA 93662",
  broker_address_2: null,
  agent_name: null,
  stops: [
    {
      id: "abded75c-dcb7-4314-a4b0-4ef8257f0711",
      load_id: "fddd18af-a667-4c2c-8b50-091b0f375a95",
      type: "pickup",
      location: "366 E 58th Street Los Angeles, CA 90011",
      time_type: "window",
      appointment_time: null,
      window_start: "2025-09-15T15:00:00.000Z",
      window_end: "2025-09-15T23:30:00.000Z",
    },
    {
      id: "c25c94be-352f-487c-ae4a-d614c0b8bc36",
      load_id: "fddd18af-a667-4c2c-8b50-091b0f375a95",
      type: "delivery",
      location: "9668 Heinrich Hertz Dr Ste G San Diego, CA 92154",
      time_type: "window",
      appointment_time: null,
      window_start: "2025-09-15T15:30:00.000Z",
      window_end: "2025-09-15T23:30:00.000Z",
    },
  ],
}

export default function HomePage({ params }) {
  const { id } = React.use(params)

  return <LoadDetailsPage id={id} />
}
