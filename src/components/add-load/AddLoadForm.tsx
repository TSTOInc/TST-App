"use client"

import React from "react"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import ProgressStepBar from "../custom/ProgressStepBar"
import StopsStep from "./StopsStep"
import LoadDetailsStep from "./LoadDetailsStep"
import PartiesStep from "./PartiesStep"
import TagsStep from "./TagsStep"

const stepLabels = ["Stops", "Load Details", "Parties", "Tags"]


const stopSchema = z.object({
  type: z.enum(["pickup", "stop", "delivery"]),
  location: z.string().min(1, "Location is required"),
  timeType: z.enum(["appointment", "window"]),
  appointmentTime: z.date().optional(),
  windowStart: z.date().optional(),
  windowEnd: z.date().optional(),
}).superRefine(({ timeType, appointmentTime, windowStart, windowEnd }, ctx) => {
  if (timeType === "appointment") {
    if (!appointmentTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Appointment time is required",
        path: ["appointmentTime"],
      });
    }
  } else {
    if (!windowStart) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Window start time is required",
        path: ["windowStart"],
      });
    }
    if (!windowEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Window end time is required",
        path: ["windowEnd"],
      });
    }
    if (windowStart && windowEnd && windowStart >= windowEnd) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Window start must be before end",
        path: ["windowEnd"],
      });
    }
  }
});

const formSchema = z.object({
  stops: z.array(stopSchema).min(2, "At least 2 stops required").max(10, "Max 10 stops"),
  loadDetails: z.object({
    loadNumber: z.string().min(1, "Load Number required"),
    commodity: z.string().min(1, "Commodity required"),
    loadType: z.enum(["FTL", "LTL"]),
    equipmentType: z.enum(["reefer", "van", "flatbed"]),
    lengthFt: z.string().min(1, "Length required"),
    rate: z.string().min(1, "Rate required"),
    instructions: z.string().optional(),
  }),
  parties: z.object({
    broker: z.string().min(1, "Broker required"),
    driver: z.array(z.string().min(1, "Driver required"))
      .min(1, "At least one driver required")
      .max(2, "Maximum two drivers allowed"),
    truck: z.string().min(1, "Truck required"),
    trailer: z.string().min(1, "Trailer required"),
  }),
  tags: z.array(z.string()).optional(),
})

type FormData = z.infer<typeof formSchema>

export default function AddLoadForm() {
  const {
    control,
    handleSubmit,
    watch,
    trigger,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      stops: [
        {
          type: "pickup",
          location: "",
          timeType: "appointment",
          appointmentTime: undefined,
          windowStart: undefined,
          windowEnd: undefined,
        },
        {
          type: "delivery",
          location: "",
          timeType: "appointment",
          appointmentTime: undefined,
          windowStart: undefined,
          windowEnd: undefined,
        },
      ],
      loadDetails: {
        loadNumber: "",
        commodity: "",
        loadType: "FTL",
        equipmentType: "reefer",
        lengthFt: "",
        rate: "",
        instructions: "",
      },
      parties: {
        broker: "",
        driver: [""],
        truck: "",
        trailer: "",
      },
      tags: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "stops",
  })

  const [currentStep, setCurrentStep] = React.useState(1)
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([])
  const stops = watch("stops")

  const validateStep = async (step: number) => {
    let valid = false
    switch (step) {
      case 1:
        valid = await trigger("stops")
        break
      case 2:
        valid = await trigger("loadDetails")
        break
      case 3:
        valid = await trigger("parties")
        break
      case 4:
        valid = true
        break
    }
    if (!valid) {
      toast.error("Please fill all required fields in this step")
    }
    return valid
  }

  const onNext = async () => {
    const valid = await validateStep(currentStep)
    if (!valid) return

    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps((steps) => [...steps, currentStep])
    }
    setCurrentStep((s) => Math.min(s + 1, stepLabels.length))
  }

  const onPrev = () => setCurrentStep((s) => Math.max(s - 1, 1))

  const onStepClick = async (step: number) => {
    if (completedSteps.includes(step) || step < currentStep) {
      setCurrentStep(step)
    }
  }

  const onSubmit = (data: FormData) => {
    console.log("Final Load JSON:", data)
    toast.success("Form data logged to console")
  }

  const canAddStop = fields.length < 10
  const canRemoveStop = fields.length > 2

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
      <ProgressStepBar
        steps={stepLabels}
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={onStepClick}
      />

      <div className="rounded-lg border p-4 bg-transparent">
        {currentStep === 1 && (
          <StopsStep
            control={control}
            errors={errors}
            stops={stops}
            canAddStop={canAddStop}
            canRemoveStop={canRemoveStop}
            append={append}
            remove={remove}
            fields={fields}
          />
        )}
        {currentStep === 2 && (
          <LoadDetailsStep control={control} errors={errors} />
        )}
        {currentStep === 3 && (
          <PartiesStep control={control} errors={errors} />
        )}
        {currentStep === 4 && <TagsStep control={control} />}
      </div>

      <div className="flex justify-between mt-6">
        <Button
          type="button"
          variant="outline"
          disabled={currentStep === 1}
          onClick={onPrev}
        >
          Back
        </Button>
        {currentStep < stepLabels.length ? (
          <Button type="button" onClick={onNext}>
            Next
          </Button>
        ) : (
          <Button type="submit">Submit</Button>
        )}
      </div>
    </form>
  )
}