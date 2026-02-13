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
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";


const statuses: ComboBoxOption[] = [
  { value: "active", label: "Active" },
  { value: "fixing", label: "Fixing" },
  { value: "inactive", label: "Inactive" },
];

const equipmentTypes: ComboBoxOption[] = [
  { value: "reefer", label: "Reefer" },
  { value: "dry_van", label: "Dry Van" },
  { value: "flatbed", label: "Flatbed" },
  { value: "step_deck", label: "Step Deck" },
  { value: "double_drop", label: "Double Drop" },
  { value: "lowboy", label: "Lowboy" },
  { value: "conestoga", label: "Conestoga" },
  { value: "tank", label: "Tank" },
  { value: "container_chassis", label: "Container Chassis" },
  { value: "power_only", label: "Power Only" },
  { value: "extendable_flatbed", label: "Extendable Flatbed" },
  { value: "gooseneck", label: "Gooseneck" },
  { value: "side_kit_flatbed", label: "Side Kit Flatbed" },
  { value: "dump_trailer", label: "Dump Trailer" },
  { value: "auto_carrier", label: "Auto Carrier" },
  { value: "hot_shot", label: "Hot Shot" },
  { value: "livestock_trailer", label: "Livestock Trailer" },
  { value: "vacuum_trailer", label: "Vacuum Trailer" },
  { value: "car_flatbed", label: "Car Flatbed" },
  { value: "platform", label: "Platform" },
  { value: "box_trailer", label: "Box Trailer" },
  { value: "curtain_side", label: "Curtain Side" },
  { value: "coil_carrier", label: "Coil Carrier" },
];

const stepLabels = ["Info", "Picture"]; // swapped order

const formSchema = z.object({
  picture: z.any().optional(),
  equipment_number: z.string().min(1, "Equipment number required"),
  equipment_length: z.string().min(1, "Equipment length required"),
  equipment_type: z.string().min(1),
  status: z.string().min(1),
});

type FormData = z.infer<typeof formSchema>;

export default function AddEquipmentForm() {
  const router = useRouter();
  const createEquipment = useMutation(api.equipment.create);


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
      equipment_number: "",
      equipment_length: "",
      equipment_type: equipmentTypes[0].value,
      status: statuses[0].value,
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
      const res = await fetch(`/api/upload/image/equipment`, {
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
      const valid = await trigger(["equipment_number", "equipment_length", "equipment_type", "status"]);
      if (!valid) {
        toast.error("Please fill all required info first");
        return;
      }
      setCurrentStep(2);
      setCompletedSteps((prev) => (prev.includes(1) ? prev : [...prev, 1]));
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

      const payload = {
        equipment_number: data.equipment_number,
        equipment_length: data.equipment_length || null,
        equipment_type: data.equipment_type,
        status: data.status,
        image_url: imageUrl,
      };
      const promise = createEquipment({ equipment: payload });

      toast.promise(promise, {
        loading: "Adding equipment...",
        success: "✅ Equipment added successfully!",
        error: (err: any) => `❌ ${err.message || "Failed to add equipment"}`,
      });;

      const newEquipmentId = await promise;

      if (newEquipmentId) {
        router.push(`/equipment/${newEquipmentId}`);
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
            <div className="grid w-full items-center gap-4">
              <Label required>Equipment number</Label>
              <Controller
                name="equipment_number"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter equipment number" />}
              />
              {errors.equipment_number && (
                <p className="text-red-500">{errors.equipment_number.message}</p>
              )}

              <Label>Equipment type</Label>
              <Controller
                name="equipment_type"
                control={control}
                render={({ field }) => (
                  <ComboBox
                    options={equipmentTypes}
                    showBadges={false}
                    defaultValue={equipmentTypes.find((t) => t.value === field.value)}
                    onSelect={(option) => field.onChange(option.value)}
                  />
                )}
              />

              <Label required>Equipment length</Label>
              <Controller
                name="equipment_length"
                control={control}
                render={({ field }) => <Input {...field} placeholder="Enter length in ft" />}
              />
              {errors.equipment_length && (
                <p className="text-red-500">{errors.equipment_length.message}</p>
              )}

              <Label>Equipment status</Label>
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
