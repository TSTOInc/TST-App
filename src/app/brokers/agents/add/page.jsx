"use client";

import React, { useState, useEffect } from "react";
import * as z from "zod";
import { toast } from "sonner";
import DynamicMultiStepForm, { StepConfig } from "@/components/forms/DynamicMultiStepForm";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";

// Validation schema
const exampleSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  broker_id: z.string().min(1, "Broker required"),
});

const Page = () => {
  const router = useRouter();
  const brokersData = useQuery(api.getTable.all, { table: "brokers" });
  const createBrokerAgent = useMutation(api.broker_agents.create);
  const brokers = brokersData?.map((broker) => ({
    value: broker._id,
    label: broker.name,
    description: `${broker.address || ""}${broker.address_2 ? ", " + broker.address_2 : ""}`,
  })) ?? [];
  const loadingBrokers = brokersData === undefined;

  const handleSubmitApi = async (data) => {
    console.log(data);
    try {

      const promise = createBrokerAgent({ agent: data });
      await toast.promise(promise, {
        loading: "Adding Broker Agent...",
        success: "✅ Broker Agent added successfully!",
        error: (err) => `❌ ${err.message || "Failed to add Broker Agent"}`,
      })

      const newBrokersAgentsId = await promise;

      if (newBrokersAgentsId) {
        router.push(`/brokers/agents/${newBrokersAgentsId}`);
      }

    } catch (err) {
      console.error(err);
    }
  };

  const stepConfig = [
    {
      label: "Basic Info",
      fields: [
        { name: "name", label: "Name", type: "text", required: true },
        { name: "email", label: "Email", type: "email" },
        { name: "phone", label: "Phone", type: "phone" },
        { name: "position", label: "Position", type: "text" },
        {
          name: "broker_id",
          label: "Broker",
          type: "combo",
          options: brokers,
          required: true,
          placeholder: loadingBrokers ? "Loading brokers..." : "Select broker",
        },
      ],
    },
  ];

  return (
    <div className="p-6">
      <DynamicMultiStepForm
        showProgressBar={false}
        steps={stepConfig}
        schema={exampleSchema}
        onSubmit={handleSubmitApi}
      />
    </div>
  );
};

export default Page;
