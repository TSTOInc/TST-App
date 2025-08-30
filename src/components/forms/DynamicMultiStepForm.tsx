"use client";
import { toast } from "sonner";
import React, { useState, useEffect, ReactNode } from "react";
import { useForm, Controller, FieldValues, UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import ProgressStepBar from "@/components/custom/ProgressStepBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ComboBox, { ComboBoxOption } from "@/components/custom/ComboBox";
import { IconLoader2 } from "@tabler/icons-react";
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

type FieldType =
  | "text"
  | "email"
  | "phone"
  | "combo"
  | "file"
  | "picture"
  | "textarea"
  | "custom";

export interface DynamicFormField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: ComboBoxOption[]; // for combo
  render?: (props: {
    field: any;
    form: UseFormReturn<FieldValues>;
  }) => ReactNode; // for custom
  defaultValue?: any;
}

export interface StepConfig {
  label: string;
  fields: DynamicFormField[];
}

export interface DynamicMultiStepFormProps {
  steps: StepConfig[];
  schema: z.ZodSchema<any>;
  onSubmit: (data: any) => Promise<void> | void;
  initialValues?: Record<string, any>;
  submitButtonText?: string;
  showProgressBar?: boolean;
  loading?: boolean;
}

function computeDefaultValues(
  steps: StepConfig[],
  initialValues?: Record<string, any>
): Record<string, any> {
  const defaults: Record<string, any> = { ...(initialValues || {}) };
  steps.forEach((step) => {
    step.fields.forEach((field) => {
      if (defaults[field.name] === undefined && field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
  });
  return defaults;
}

export default function DynamicMultiStepForm({
  steps,
  schema,
  onSubmit,
  initialValues = {},
  submitButtonText = "Submit",
  showProgressBar = true,
  loading = false,
}: DynamicMultiStepFormProps) {
  const computedDefaults = computeDefaultValues(steps, initialValues);

  const {
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors },
    ...formRest
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: computedDefaults,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const stepLabels = steps.map((step) => step.label);

  // Handles validation for only fields in the current step
  const onNext = async () => {
    const stepFieldNames = steps[currentStep - 1].fields.map((f) => f.name);
    const valid = await trigger(stepFieldNames);

    if (!valid) {
      // collect missing required field names
      const missingFields = stepFieldNames.filter(
        (name) => !!errors[name]
      ).map((name) => steps[currentStep - 1].fields.find(f => f.name === name)?.label);

      toast.error("Please fill out all required fields");

      return; // prevent moving to next step
    }

    // advance step if valid
    if (currentStep < steps.length) {
      setCurrentStep((s) => s + 1);
      setCompletedSteps((prev) =>
        prev.includes(currentStep) ? prev : [...prev, currentStep]
      );
    }
  };




  const onPrev = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleFinalSubmit = handleSubmit(async (data: any) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
    } catch (err) {
      // handle error if needed
    } finally {
      setSubmitting(false);
      setOpenDialog(false);
    }
  });

  // Render a field based on type
  const renderField = (field: DynamicFormField, idx: number) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <div key={field.name}>
            <Label required={field.required}>{field.label}</Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: rhfField }) => (
                <Input
                  {...rhfField}
                  type={field.type === "phone" ? "tel" : field.type}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                />
              )}
            />
            {errors[field.name]?.message && (
              <p className="text-red-500 text-sm">{String(errors[field.name]?.message)}</p>
            )}
          </div>
        );
      case "combo":
        return (
          <div key={field.name}>
            <Label required={field.required}>{field.label}</Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: rhfField }) => (
                <ComboBox
                  options={field.options || []}
                  showBadges
                  defaultValue={(field.options ?? []).find((o) => o.value === rhfField.value)}
                  onSelect={(option) => rhfField.onChange(option.value)}
                />
              )}
            />
            {errors[field.name]?.message && (
              <p className="text-red-500 text-sm">{String(errors[field.name]?.message)}</p>
            )}
          </div>
        );
      case "file":
        // You can swap for your own file upload component
        return (
          <div key={field.name}>
            <Label required={field.required}>{field.label}</Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: rhfField }) => (
                <Input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) rhfField.onChange(e.target.files[0]);
                  }}
                />
              )}
            />
            {errors[field.name]?.message && (
              <p className="text-red-500 text-sm">{String(errors[field.name]?.message)}</p>
            )}
          </div>
        );
      case "picture":
        // Replace with your own ProfilePictureUpload if needed
        return (
          <div key={field.name}>
            <Label required={field.required}>{field.label}</Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: rhfField }) => (
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) rhfField.onChange(e.target.files[0]);
                  }}
                />
              )}
            />
            {errors[field.name]?.message && (
              <p className="text-red-500 text-sm">{String(errors[field.name]?.message)}</p>
            )}
          </div>
        );
      case "textarea":
        return (
          <div key={field.name}>
            <Label required={field.required}>{field.label}</Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: rhfField }) => (
                <Textarea
                  {...rhfField}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  className="w-full rounded-md border p-2"
                />
              )}
            />
            {errors[field.name]?.message && (
              <p className="text-red-500 text-sm">
                {String(errors[field.name]?.message)}
              </p>
            )}
          </div>
        );
      case "custom":
        return (
          <div key={field.name}>
            {field.render?.({
              field: control._fields[field.name],
              form: { handleSubmit, control, watch, trigger, formState: { errors }, ...formRest }
            })}
          </div>
        );
      default:
        return null;
    }
  };

  const stepFields = steps[currentStep - 1].fields;

  return (
    <div className="p-6">
      <div className={submitting || loading ? "pointer-events-none opacity-60" : "space-y-6"}>
        {showProgressBar && (
          <ProgressStepBar
            steps={stepLabels}
            currentStep={currentStep}
            completedSteps={completedSteps}
            onStepClick={(step) => step < currentStep && setCurrentStep(step)}
          />
        )}
        <form className="rounded-lg border p-4" onSubmit={handleSubmit(handleFinalSubmit)}>
          <div className="grid w-full items-center gap-4">
            {stepFields.map(renderField)}
          </div>
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep > 1 ? onPrev : undefined}
              disabled={currentStep === 1 || submitting || loading}
            >
              Back
            </Button>
            {currentStep < stepLabels.length ? (
              <Button type="button" onClick={onNext} disabled={submitting || loading}>
                Next
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit(handleFinalSubmit)}
                disabled={submitting || loading}
              >
                Submit
              </Button>
            )}


          </div>
        </form>
      </div>
      {/* Optional: Dialog for missing required (e.g., picture) */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              You are about to submit without all required fields. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setOpenDialog(false);
                handleFinalSubmit();
              }}
              disabled={submitting || loading}
            >
              Submit Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}