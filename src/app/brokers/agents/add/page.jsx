"use client";

import React, { useState, useEffect } from "react";
import * as z from "zod";
import { toast } from "sonner";
import DynamicMultiStepForm, { StepConfig } from "@/components/forms/DynamicMultiStepForm";

// Validation schema
const exampleSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().optional(),
  broker_id: z.string().min(1, "Broker required"),
});

const Page = () => {
  const [brokers, setBrokers] = useState([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);

  // Fetch brokers list on mount
  useEffect(() => {
    const fetchBrokers = async () => {
      setLoadingBrokers(true);
      try {
        const res = await fetch(`api/get/brokers`);
        if (!res.ok) throw new Error("Failed to load brokers");

        const data = await res.json();

        // Adapt your backend response here:
        const options = data.map((broker) => ({
          value: broker.id?.toString() || broker.name,
          label: broker.name,
        }));

        setBrokers(options);
      } catch (err) {
        toast.error(err.message || "Error loading brokers");
      } finally {
        setLoadingBrokers(false);
      }
    };

    fetchBrokers();
  }, []);

  const handleSubmitApi = async (data) => {
    console.log(data);
    try {
      await toast.promise(
        fetch(`api/add/brokers/agents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to submit");
          return res.json();
        }),
        {
          loading: "Submitting...",
          success: "Submitted successfully!",
          error: (err) => err?.message || "Submission failed",
        }
      );
    } catch (err) {
      toast.error(err.message || "Something went wrong");
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
