"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "../../ui/button";
import { toast } from "sonner";
import ProgressStepBar from "../../custom/ProgressStepBar";
import { Input } from "../../ui/input";
import { Field, FieldLabel, FieldDescription } from "../../ui/field";
import ProfilePictureUpload from "../../custom/ProfilePictureUpload";
import ComboBox, { ComboBoxOption } from "../../custom/ComboBox";
import { IconLoader2 } from "@tabler/icons-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "../../ui/dialog";
import DocUpload from "../../custom/DocUpload";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

const stepLabels = ["Info", "License", "Picture"];
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
  email: z.string().email("Invalid email format").optional().or(z.literal("")),
  status: z.string().min(1, "Status required"),
});

type FormData = z.infer<typeof formSchema>;

export default function AddDriverForm() {
  const router = useRouter();
  const createDriver = useMutation(api.drivers.create);

  const {
    handleSubmit,
    control,
    watch,
    trigger,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // 👈 Real-time error removal as you type
    defaultValues: {
      picture: undefined,
      name: "",
      license_number: "",
      phone: "",
      email: undefined,
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
      const res = await fetch(`/api/upload/image/drivers`, {
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
        email: data.email || undefined,
        image_url: imageUrl || undefined,
        license_number: data.license_number,
        name: data.name,
        phone: data.phone,
        status: data.status,
      };

      const promise = createDriver({ driver: payload });

      toast.promise(promise, {
        loading: "Adding Driver...",
        success: "✅ Driver added successfully!",
        error: (err: any) => `❌ ${err.message || "Failed to add Driver"}`,
      });

      const newDriverId = await promise;

      if (newDriverId) {
        router.push(`/drivers/${newDriverId}`);
      }
    } catch (err: any) {
      console.error(err);
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
            <div className="grid w-full items-center gap-6">
              {/* NAME */}
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="name" required>Name</FieldLabel>
                    <Input {...field} id="name" placeholder="Enter name" aria-invalid={!!error} />
                    {error && <FieldDescription className="text-red-500">{error.message}</FieldDescription>}
                  </Field>
                )}
              />

              {/* LICENSE NUMBER */}
              <Controller
                name="license_number"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="license_number">License Number</FieldLabel>
                    <Input {...field} id="license_number" placeholder="Enter license number" aria-invalid={!!error} />
                    {error && <FieldDescription className="text-red-500">{error.message}</FieldDescription>}
                  </Field>
                )}
              />

              {/* PHONE NUMBER */}
              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="phone" required>Phone number</FieldLabel>
                    <Input {...field} id="phone" placeholder="Enter phone number" aria-invalid={!!error} />
                    {error && <FieldDescription className="text-red-500">{error.message}</FieldDescription>}
                  </Field>
                )}
              />

              {/* EMAIL */}
              <Controller
                name="email"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input {...field} id="email" placeholder="Enter email" aria-invalid={!!error} />
                    {error && <FieldDescription className="text-red-500">{error.message}</FieldDescription>}
                  </Field>
                )}
              />

              {/* DRIVER STATUS */}
              <Controller
                name="status"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="status">Driver status</FieldLabel>
                    <ComboBox
                      options={statuses}
                      showBadges
                      defaultValue={statuses.find((s) => s.value === field.value)}
                      onSelect={(option) => field.onChange(option.value)}
                    />
                    {error && <FieldDescription className="text-red-500">{error.message}</FieldDescription>}
                  </Field>
                )}
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid w-full items-center gap-4">
              <Field>
                <div className="flex justify-center mb-2">
                  <FieldLabel className="text-lg">Upload License</FieldLabel>
                </div>
                <DocUpload onChange={(file: File) => setSelectedFile(file)} />
              </Field>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid w-full items-center gap-6">
              {/* PICTURE */}
              <Controller
                name="picture"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <Field data-invalid={!!error}>
                    <FieldLabel htmlFor="picture">Picture</FieldLabel>
                    <ProfilePictureUpload onChange={(file: File) => field.onChange(file)} />
                    {preview && (
                      <div className="mt-2 relative h-32 w-32 border rounded overflow-hidden">
                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                    {error && <FieldDescription className="text-red-500">{error.message}</FieldDescription>}
                  </Field>
                )}
              />
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
                handleSubmit((data) => submitForm({ ...data, picture: undefined }))();
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