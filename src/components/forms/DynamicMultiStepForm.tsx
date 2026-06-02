"use client";

import { toast } from "sonner";
import React, { useState, ReactNode } from "react";
import { useForm, Controller, FieldValues, UseFormReturn, FieldErrors } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import ProgressStepBar from "@/components/custom/ProgressStepBar";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import ComboBox, { ComboBoxOption } from "@/components/custom/ComboBox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import SearchableSelect from "../comp-229";

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
  options?: ComboBoxOption[];
  render?: (props: {
    field: any;
    form: UseFormReturn<FieldValues, any>;
  }) => ReactNode;
  defaultValue?: any;
}

export interface StepConfig {
  label: string;
  fields: DynamicFormField[];
}

export interface DynamicMultiStepFormProps {
  steps: StepConfig[];
  schema: z.ZodType<any, any, any>;
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
    formState,
    ...formRest
  } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange", // 👈 Enables real-time input error dismissal
    defaultValues: computedDefaults,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const stepLabels = steps.map((step) => step.label);

  const onNext = async () => {
    const stepFieldNames = steps[currentStep - 1].fields.map((f) => f.name);
    const valid = await trigger(stepFieldNames as any);

    if (!valid) {
      toast.error("Please fill out all required fields");
      return;
    }

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
    } finally {
      setSubmitting(false);
      setOpenDialog(false);
    }
  });

  const renderField = (field: DynamicFormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: rhfField, fieldState: { error } }) => (
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor={field.name} required={field.required}>
                  {field.label}
                </FieldLabel>
                <Input
                  {...rhfField}
                  id={field.name}
                  type={field.type === "phone" ? "tel" : field.type}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  aria-invalid={!!error}
                />
                {error && (
                  <FieldDescription className="text-red-500">
                    {error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        );
      case "combo":
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: rhfField, fieldState: { error } }) => (
              <Field data-invalid={!!error}>
                <Controller
                  name={field.name}
                  control={control}
                  render={({ field: selectField }) => (
                    <SearchableSelect
                      label={field.label}
                      required={field.required}
                      options={field.options || []}
                      value={selectField.value}
                      onChange={selectField.onChange}
                      placeholder={`Select ${field.label.toLowerCase()}`}
                    />
                  )}
                />
                {error && (
                  <FieldDescription className="text-red-500">
                    {error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        );
      case "file":
      case "picture":
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: rhfField, fieldState: { error } }) => (
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor={field.name} required={field.required}>
                  {field.label}
                </FieldLabel>
                <Input
                  id={field.name}
                  type="file"
                  accept={field.type === "picture" ? "image/*" : undefined}
                  aria-invalid={!!error}
                  onChange={(e) => {
                    if (e.target.files?.[0]) rhfField.onChange(e.target.files[0]);
                  }}
                />
                {error && (
                  <FieldDescription className="text-red-500">
                    {error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        );
      case "textarea":
        return (
          <Controller
            key={field.name}
            name={field.name}
            control={control}
            render={({ field: rhfField, fieldState: { error } }) => (
              <Field data-invalid={!!error}>
                <FieldLabel htmlFor={field.name} required={field.required}>
                  {field.label}
                </FieldLabel>
                <Textarea
                  {...rhfField}
                  id={field.name}
                  placeholder={`Enter ${field.label.toLowerCase()}`}
                  aria-invalid={!!error}
                />
                {error && (
                  <FieldDescription className="text-red-500">
                    {error.message}
                  </FieldDescription>
                )}
              </Field>
            )}
          />
        );
      case "custom":
        return (
          <div key={field.name}>
            {field.render?.({
              field: control._fields[field.name],
              form: { handleSubmit, control, watch, trigger, formState, ...formRest },
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
        <form className="rounded-lg border p-4" onSubmit={handleFinalSubmit}>
          <div className="grid w-full items-center gap-6">
            {stepFields.map((field) => {
              if (field.name === "city") {
                return (
                  <div key="city-state-zip" className="grid grid-cols-3 gap-4">
                    {["city", "state", "zip"].map((f) => {
                      const groupedField = stepFields.find((sf) => sf.name === f);
                      return groupedField ? renderField(groupedField) : null;
                    })}
                  </div>
                );
              }

              if (["state", "zip"].includes(field.name)) return null;

              return renderField(field);
            })}
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
              <Button type="button" onClick={handleFinalSubmit} disabled={submitting || loading}>
                {submitButtonText}
              </Button>
            )}
          </div>
        </form>
      </div>

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