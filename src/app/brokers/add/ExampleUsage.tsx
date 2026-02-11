"use client";
export const dynamic = "force-dynamic";

import * as z from "zod";
import { useState, useEffect } from "react";
import DynamicMultiStepForm, { StepConfig } from "../../../components/forms/DynamicMultiStepForm";
import { ComboBoxOption } from "@/components/custom/ComboBox";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useRouter } from "next/navigation";

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
      { name: "city", label: "City", type: "text", required: true },
      { name: "state", label: "State", type: "text", required: true },
      { name: "zip", label: "Zip", type: "text", required: true },
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
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  zip: z.string().min(1, "Zip required"),
  status: z.string().min(1, "Status required"),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  picture: z.instanceof(File).optional(),
});


export default function ExampleUsage() {

  const organization = useQuery(api.organizations.getCurrentOrganization)
  const orgId = organization?._id ? organization._id : "";
  const createBroker = useMutation(api.brokers.create)

  function parseAddress(input: string) {
    const regex =
      /^(.+?),\s*(.+?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)$/;

    const match = input.match(regex);
    if (!match) return null;

    return {
      address: match[1].trim(),
      city: match[2].trim(),
      state: match[3].trim(),
      zip: match[4].trim(),
    };
  }



  const searchParams = useSearchParams();
  const [initialValues, setInitialValues] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    const fullAddress = searchParams.get("address") || "";
    const parsed = parseAddress(fullAddress);
    setInitialValues({
      name: searchParams.get("name") || "",
      usdot_number: searchParams.get("usdot_number") || "",
      docket_number: searchParams.get("docket_number") || "",
      address: parsed?.address || fullAddress,
      city: parsed?.city || searchParams.get("city") || "",
      state: parsed?.state || searchParams.get("state") || "",
      zip: parsed?.zip || searchParams.get("zip") || "",
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

    const res = await fetch(`/api/upload/image/brokers`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("File upload failed");

    const data = await res.json();
    return data.url; // URL of uploaded file
  }

  const handleSubmitApi = async (data: any) => {
    try {
      //let pictureUrl = null;

      //if (data.picture) {
      // Upload the picture first
      //pictureUrl = await uploadFile(data.picture);
      //}
      const address_2 = `${data.city || ""}, ${data.state || ""} ${data.zip || ""}`.trim();
      const { city, state, zip, picture, ...rest } = data
      // Prepare payload without the file
      const payload = {
        ...rest,
        image_url: "",
        address_2,
        notes: "",
        org_id: orgId,
      }

      await toast.promise(
        createBroker({ broker: payload }), // no need for fetch — Convex handles it
        {
          loading: "Submitting...",
          success: "Submitted successfully!",
          error: (err: any) => err?.message || "Submission failed",
        }
      )
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
