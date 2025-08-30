"use client";

import * as z from "zod";
import DynamicMultiStepForm, { StepConfig } from "./DynamicMultiStepForm";
import { ComboBoxOption } from "@/components/custom/ComboBox";

const statusOptions: ComboBoxOption[] = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Suspended", value: "suspended" },
];

const stepConfigs: StepConfig[] = [
  {
    label: "Basic Info",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email" },
      { name: "status", label: "Status", type: "combo", options: statusOptions, required: true },
    ],
  },
  {
    label: "Photo",
    fields: [
      { name: "picture", label: "Picture", type: "picture" },
    ],
  },
  {
    label: "Upload License",
    fields: [
      { name: "license", label: "License", type: "file", required: true },
    ],
  },
];

const exampleSchema = z.object({
  name: z.string().min(1, "Name required"),
  email: z.string().email().optional(),
  status: z.string().min(1, "Status required"),
  picture: z.any().optional(),
  license: z.any(),
});

export default function ExampleUsage() {
  return (
    <DynamicMultiStepForm
      steps={stepConfigs}
      schema={exampleSchema}
      onSubmit={async (data) => {
        alert(JSON.stringify(data, null, 2));
      }}
    />
  );
}