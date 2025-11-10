import React from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2 } from "lucide-react"
import { IconCircleDashed, IconLoader2 } from "@tabler/icons-react"

interface ProgressStepBarProps {
  steps: string[] // required input
  currentStep: number
  completedSteps: number[]
  onStepClick: (step: number) => void
}

export default function ProgressStepBar({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: ProgressStepBarProps) {
  return (
    <div className="flex items-center w-full px-4 select-none">
      {steps.map((label, index) => {
        const stepNumber = index + 1
        const isCompleted = completedSteps.includes(stepNumber)
        const isActive = currentStep === stepNumber
        const isLast = index === steps.length - 1

        let connectorColor = "bg-muted"
        if (isCompleted) connectorColor = "bg-green-600"
        else if (isActive) connectorColor = "bg-foreground animate-pulse"

        const icon =
          isCompleted && !isActive ? (
            <CheckCircle2 size={16} />
          ) : isActive ? (
            <IconLoader2 size={16} className="animate-spin" />
          ) : (
            <IconCircleDashed size={16} />
          )

        const circleClasses = cn(
          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 cursor-pointer",
          isActive
            ? "bg-foreground text-background"
            : isCompleted
            ? "bg-green-600 text-white"
            : "bg-muted text-muted-foreground",
          !isCompleted && !isActive && "cursor-not-allowed opacity-50"
        )

        return (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center text-center w-20 flex-shrink-0">
              <button
                type="button"
                disabled={!isCompleted && !isActive}
                onClick={() => onStepClick(stepNumber)}
                className={circleClasses}
              >
                {icon}
              </button>
              <span className="text-xs mt-2">{label}</span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "flex-grow h-[2px] mb-6 transition-all duration-900",
                  connectorColor
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
