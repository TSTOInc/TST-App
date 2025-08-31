"use client";

import { useState, useEffect } from "react";
import { Truck, FileText, CircleCheckBig, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function TruckProgressSlider({ stops, currentStep: initialStep = 0, onStepChange }) {
  // Read from localStorage OR fallback to initialStep
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("currentStep");
      return saved !== null ? parseInt(saved, 10) : initialStep;
    }
    return initialStep;
  });

  useEffect(() => {
    console.log("Current step changed:", currentStep);
    localStorage.setItem("currentStep", currentStep.toString());
    if (onStepChange) onStepChange(currentStep);
  }, [currentStep, onStepChange]);

  const stepActions = [
    { id: "inTransit-start", label: "Arrived at Pickup" },
    { id: "pickup", label: "Picked up the load" },
    { id: "pickedUp", label: "On route to Delivery" },
    { id: "deliveryArrived", label: "Arrived at Delivery" },
    { id: "delivered", label: "Delivered the load" },
    { id: "invoiced", label: "Invoice sent" },
  ];

  const animProps = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: { duration: 0.5 },
  };

  const buildStops = (stops) => [
    { id: "inTransit-start", type: "inTransit", label: "In Transit", firstStep: true },
    ...stops.flatMap((stop, i) =>
      i < stops.length - 1 ? [stop, { id: `inTransit-${i}`, type: "inTransit", noLabel: true }] : [stop]
    ),
    { id: "Invoicing", type: "invoicing" },
    { id: "Invoice", type: "Invoice" },
  ];

  const allStops = buildStops(stops);
  const stopCount = allStops.length;

  const getStopPosition = (index) => (index / (stopCount - 1)) * 100;
  const formatTime = (stop) =>
    stop.appointment_time
      ? new Date(stop.appointment_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : stop.window_start && stop.window_end
      ? `${new Date(stop.window_start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(
          stop.window_end
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "";

  const handleNextStep = () => {
    const next = Math.min(currentStep + 1, stopCount - 1);
    setCurrentStep(next);
  };

  const getCircleClass = (stop, isCompleted, isActive) => {
    if (isCompleted || isActive) return "bg-blue-600 w-6 h-6";
    if (stop.firstStep) return "bg-neutral-600 w-6 h-6";
    if (stop.type === "inTransit" || stop.type === "invoicing") return "bg-blue-600 w-0 h-0";
    return "bg-neutral-600 w-6 h-6";
  };

  const renderIcon = (stop, isCompleted, isActive) => {
    if (isCompleted) return <CircleCheckBig className="w-4 h-4 text-white" />;
    if (isActive) return <div className="w-4 h-4" />;
    if (stop.type === "Invoice") return <FileText className="w-4 h-4 text-white" />;
    if (stop.type !== "inTransit" && stop.type !== "invoicing") return <MapPin className="w-4 h-4 text-white" />;
    return null;
  };

  const renderLabel = (stop, isCompleted, isActive) => {
    if (stop.firstStep) return isCompleted ? "Transit Completed" : stop.label;
    if (stop.noLabel) return "";
    if (stop.type === "pickup")
      return isCompleted
        ? "Picked up"
        : isActive
        ? "On site at Pickup"
        : stop.appointment_time || stop.window_start
        ? (
          <>
            Pickup at <br /> {formatTime(stop)}
          </>
        )
        : "";
    if (stop.type === "delivery")
      return isCompleted
        ? "Delivered"
        : isActive
        ? "On site at Delivery"
        : stop.appointment_time || stop.window_start
        ? (
          <>
            Delivery at <br /> {formatTime(stop)}
          </>
        )
        : "";
    if (stop.type === "inTransit") return isActive ? "In Transit" : "";
    if (stop.type === "invoicing") return isActive ? "Invoicing" : "";
    if (stop.type === "Invoice") return isActive ? "Invoiced" : "Invoice";
    return "";
  };

  return (
    <div className="px-8 mx-12">
      <div className="relative h-32">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-600 -translate-y-1/2" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ width: `${(currentStep / (stopCount - 1)) * 100}%` }}
        />

        {allStops.map((stop, index) => {
          const pos = getStopPosition(index);
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={stop.id}>
              <div
                className={`absolute rounded-full flex items-center justify-center transition-all duration-900 ease-in-out ${getCircleClass(
                  stop,
                  isCompleted,
                  isActive
                )}`}
                style={{ left: `${pos}%`, top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <AnimatePresence mode="wait">
                  <motion.div {...animProps}>{renderIcon(stop, isCompleted, isActive)}</motion.div>
                </AnimatePresence>
              </div>

              <div
                className="absolute text-center text-xs w-36"
                style={{ left: `${pos}%`, top: "65%", transform: "translateX(-50%)" }}
              >
                <div className="font-semibold">{renderLabel(stop, isCompleted, isActive)}</div>
                {stop.location && <div className="text-gray-500">{stop.location}</div>}
              </div>
            </div>
          );
        })}

        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ left: `${getStopPosition(currentStep)}%` }}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-600 -z-10" />
            <AnimatePresence mode="wait">
              {currentStep >= stopCount - 2 ? (
                <motion.div {...animProps}>
                  <FileText className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <motion.div {...animProps}>
                  <Truck className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <motion.div whileTap={{ scale: 0.95 }}>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 shadow-lg transition-all"
            onClick={handleNextStep}
            disabled={currentStep === stopCount - 1}
          >
            {stepActions[currentStep + 1]?.label || "Completed"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
