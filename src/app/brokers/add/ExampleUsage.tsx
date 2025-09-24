"use client";
export const dynamic = "force-dynamic";

import * as z from "zod";
import { useState, useEffect } from "react";
import DynamicMultiStepForm, { StepConfig } from "../../../components/forms/DynamicMultiStepForm";
import { ComboBoxOption } from "@/components/custom/ComboBox";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

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
      { name: "usdot_number", label: "USDOT Number", type: "text", required: true },
      { name: "docket_number", label: "Docket Number", type: "text", required: true },
      { name: "address", label: "Address", type: "text", required: true },
      {
        name: "status",
        label: "Status",
        type: "combo",
        options: statusOptions,
        defaultValue: "active",
        required: true,
      },
    ],
  },
  {
    label: "Additional Info",
    fields: [
      { name: "phone", label: "Phone", type: "phone" },
      { name: "email", label: "Email", type: "email" },
      { name: "website", label: "Website", type: "text" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    label: "Photo",
    fields: [{ name: "picture", label: "Picture", type: "picture" }],
  },
];

const exampleSchema = z.object({
  name: z.string().min(1, "Name required"),
  usdot_number: z.string().min(1, "USDOT required"),
  docket_number: z.string().min(1, "Docket required"),
  address: z.string().min(1, "Address required"),
  status: z.string().min(1, "Status required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional(),
  website: z.string().optional(),
  picture: z.instanceof(File).optional(),
});

export default function ExampleUsage() {
  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    setInitialValues({
      name: searchParams.get("name") || "",
      usdot_number: searchParams.get("usdot_number") || "",
      docket_number: searchParams.get("docket_number") || "",
      address: searchParams.get("address") || "",
      status: searchParams.get("status") || "active",
      phone: searchParams.get("phone") || "",
      email: searchParams.get("email") || "",
      website: searchParams.get("website") || "",
      notes: searchParams.get("notes") || "",
    });
  }, [searchParams]);
  async function uploadFile(file: File): Promise<string> {
    // Example: Uploading to a storage service and returning the public URL
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://tst.api.incashy.com/upload/image/brokers", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("File upload failed");

    const data = await res.json();
    return data.url; // URL of uploaded file
  }

  const handleSubmitApi = async (data: any) => {
    try {
      let pictureUrl = null;

      if (data.picture) {
        // Upload the picture first
        pictureUrl = await uploadFile(data.picture);
      }

      // Prepare payload without the file
      const payload = { ...data, image_url: pictureUrl };

      await toast.promise(
        fetch("https://tst.api.incashy.com/add/brokers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }).then(async (res) => {
          if (!res.ok) throw new Error("Failed to submit");
          return res.json();
        }),
        {
          loading: "Submitting...",
          success: "Submitted successfully!",
          error: (err: any) => err?.message || "Submission failed",
        }
      );
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    }
  };


  if (!initialValues) return <div>Loading...</div>;

  return (
    <DynamicMultiStepForm
      steps={stepConfigs}
      schema={exampleSchema}
      initialValues={initialValues}
      onSubmit={handleSubmitApi}
    />
  );
}
