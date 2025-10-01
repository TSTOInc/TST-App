"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProgressStepBar from "../../custom/ProgressStepBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfilePictureUpload from "@/components/custom/ProfilePictureUpload";
import ComboBox, { ComboBoxOption } from "@/components/custom/ComboBox";
import { IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import DocUpload from "@/components/custom/DocUpload";

const stepLabels = ["Info", "License", "Picture"]; // swapped order
const statuses: ComboBoxOption[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
  { value: "pending", label: "Pending" },
];

const formSchema = z.object({
  picture: z.any().optional(),
  name: z.string().min(1, "Name required"),
  license_number: z.string(),
  phone: z.string().min(1, "Phone number required"),
  email: z.string(),
  status: z.string().min(1, "Status required"),
});

type FormData = z.infer<typeof formSchema>;

export default function AddEquipmentForm() {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      picture: null,
      name: "",
      license_number: "",
      phone: "",
      email: "",
      status: statuses[0].value,
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const pictureFile = watch("picture");

  useEffect(() => {
    if (pictureFile) setPreview(URL.createObjectURL(pictureFile));
  }, [pictureFile]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("${process.env.NEXT_PUBLIC_API_BASE}/upload/image/drivers", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUploading(false);
      return data.url;
    } catch (err) {
      setUploading(false);
      throw err;
    }
  };

  const onNext = async () => {
    if (currentStep === 1) {
      const valid = await trigger(["name", "license_number", "phone", "email", "status"]);
      if (!valid) {
        toast.error("Please fill all required info first");
        return;
      }
      setCurrentStep(2);
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
    }

    if (currentStep === 2) {
      setCurrentStep(3);
      setCompletedSteps((prev) => (prev.includes(2) ? prev : [...prev, 2]));
    }
  };

  const onPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const submitForm = async (data: FormData) => {
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (data.picture) {
        imageUrl = await uploadImage(data.picture);
      }
      let licenseUrl = "";
      if (selectedFile) {
        licenseUrl = await uploadImage(selectedFile);
      }

      const payload = {
        license_url: licenseUrl,
        name: data.name,
        phone: data.phone,
        email: data.email,
        license_number: data.license_number || null,
        image_url: imageUrl,
        status: data.status,
      };

      console.log("Submitting payload:", JSON.stringify(payload));
      const response = await fetch("${process.env.NEXT_PUBLIC_API_BASE}/add/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());
      router.back();
      toast.success("Driver added successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to submit form: ${err.message}`);
    } finally {
      setSubmitting(false);
      setOpenDialog(false);
    }
  };

  const handleFinalSubmit = handleSubmit((data: FormData) => {
    if (!data.picture) {
      setOpenDialog(true);
    } else {
      submitForm(data);
    }
  });

  const isDisabled = submitting || uploading;
  return (
    <div className="p-6">
      <div className={isDisabled ? "pointer-events-none opacity-60" : "space-y-6"}>
        <ProgressStepBar
          steps={stepLabels}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={(step) => step < currentStep && setCurrentStep(step)}
        />

        <form className="rounded-lg border p-4">
          {currentStep === 1 && (
            <div className="grid w-full items-center gap-4">
              <Label required>Name</Label>
              <Controller
                name="name"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter name" />}
              />
              {errors.name && (
                <p className="text-red-500">{errors.name.message}</p>
              )}
              <Label>License Number</Label>
              <Controller
                name="license_number"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter license number" />}
              />
              {errors.license_number && (
                <p className="text-red-500">{errors.license_number.message}</p>
              )}

              <Label required>Phone number</Label>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter phone number" />}
              />
              {errors.phone && (
                <p className="text-red-500">{errors.phone.message}</p>
              )}
              <Label>Email</Label>
              <Controller
                name="email"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter email" />}
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
              <Label>Driver status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    options={statuses}
                    showBadges
                    defaultValue={statuses.find((s) => s.value === field.value)}
                    onSelect={(option) => field.onChange(option.value)}
                  />
                )}
              />
            </div>
          )}
          {currentStep === 2 && (
            <div className="grid w-full items-center">
              <div className="flex justify-center">
                <Label className="text-lg">Upload License</Label>
              </div>
              <DocUpload onChange={(file: File) => setSelectedFile(file)} />
            </div>
          )}
          {currentStep === 3 && (
            <div className="grid w-full items-center gap-3">
              <Label htmlFor="picture">Picture</Label>
              <Controller
                name="picture"
                control={control}
                render={({ field }) => (
                  <ProfilePictureUpload onChange={(file: File) => field.onChange(file)} />
                )}
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-2 h-32 w-32 object-cover rounded"
                />
              )}
            </div>
          )}

          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep > 1 ? onPrev : router.back}
            >
              Back
            </Button>
            {currentStep < stepLabels.length ? (
              <Button type="button" onClick={onNext} disabled={isDisabled}>
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleFinalSubmit} disabled={isDisabled}>
                {submitting && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Dialog for submitting without picture */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>No picture attached</DialogTitle>
            <DialogDescription>
              You have not attached a picture. Do you want to submit anyway?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpenDialog(false);
                handleSubmit((data) => submitForm({ ...data, picture: null }))();
              }}
              disabled={isDisabled}
            >
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
