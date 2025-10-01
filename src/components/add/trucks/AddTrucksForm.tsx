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

const stepLabels = ["Truck Info", "Vehicle Info", "Picture"];
const statuses: ComboBoxOption[] = [
  { value: "active", label: "Active" },
  { value: "fixing", label: "Fixing" },
  { value: "inactive", label: "Inactive" },
];

const formSchema = z.object({
  picture: z.any().optional(),
  truck_number: z.string().min(1, "Truck number required"),
  truck_alias: z.string(),
  vin: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.string(),
  transponder_id: z.string().optional(),
  status: z.string().min(1, "Status required"),
  color: z.string().optional(),
  driver_id: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function AddTrucksForm() {
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
      truck_number: "",
      truck_alias: "",
      vin: "",
      make: "",
      model: "",
      year: "",
      transponder_id: "",
      status: statuses[0].value,
      color: "",
      driver_id: "",
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const pictureFile = watch("picture");

  useEffect(() => {
    if (pictureFile) setPreview(URL.createObjectURL(pictureFile));
  }, [pictureFile]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/upload/image/trucks`, {
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
      const valid = await trigger(["truck_number", "truck_alias", "transponder_id", "status"]);
      if (!valid) {
        toast.error("Please fill all required info first");
        return;
      }
    } else if (currentStep === 2) {
      const valid = await trigger(["vin", "make", "model", "year"]);
      if (!valid) {
        toast.error("Please fill all required vehicle info first");
        return;
      }
    }

    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));
    setCurrentStep((s) => Math.min(s + 1, stepLabels.length));
  };

  const onPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const submitForm = async (data: FormData) => {
    setSubmitting(true);
    try {
      let imageUrl = "";
      if (data.picture) {
        imageUrl = await uploadImage(data.picture);
      }

      const payload = {
        image_url: imageUrl,
        truck_number: data.truck_number,
        truck_alias: data.truck_alias || null,
        vin: data.vin || null,
        make: data.make || null,
        model: data.model || null,
        year: data.year || null,
        transponder_id: data.transponder_id || null,
        driver_id: data.driver_id || null,
        status: data.status,
        color: data.color || null,
      };

      console.log("Submitting payload:", JSON.stringify(payload));

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/add/trucks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());
      router.back();
      toast.success("Truck added successfully!");
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
              <Label required>Truck Number</Label>
              <Controller
                name="truck_number"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter Truck Number" />}
              />
              {errors.truck_number && (
                <p className="text-red-500">{errors.truck_number.message}</p>
              )}
              <Label>Truck Alias</Label>
              <Controller
                name="truck_alias"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter Truck Alias" />}
              />
              {errors.truck_alias && (
                <p className="text-red-500">{errors.truck_alias.message}</p>
              )}
              <Label>Transponder ID</Label>
              <Controller
                name="transponder_id"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter Transponder ID" />}
              />
              {errors.transponder_id && (
                <p className="text-red-500">{errors.transponder_id.message}</p>
              )}
              <Label>Status</Label>
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
            <div className="grid w-full items-center gap-4">
              <Label>Vin</Label>
              <Controller
                name="vin"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter VIN Number" />}
              />
              {errors.vin && <p className="text-red-500">{errors.vin.message}</p>}

              <Label>Make</Label>
              <Controller
                name="make"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter make" />}
              />
              {errors.make && <p className="text-red-500">{errors.make.message}</p>}

              <Label>Model</Label>
              <Controller
                name="model"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter model" />}
              />
              {errors.model && <p className="text-red-500">{errors.model.message}</p>}

              <Label>Year</Label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter year" />}
              />
              {errors.year && <p className="text-red-500">{errors.year.message}</p>}
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
