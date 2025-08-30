"use client";

import { useState } from "react";
import { Truck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export default function TruckProgressSlider({ stops, currentStep: initialStep = 0 }) {
  const [currentStep, setCurrentStep] = useState(initialStep);

  const allStops = [...stops, { id: "invoiced", type: "invoiced", location: "Invoiced", time: "" }];
  const stopCount = allStops.length;

  const getStopPosition = (index) => (index / (stopCount - 1)) * 100;

  const formatTime = (stop) => {
    if (stop.appointment_time)
      return new Date(stop.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (stop.window_start && stop.window_end)
      return `${new Date(stop.window_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(stop.window_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return "";
  };

  return (
    <div className="px-8 mx-12">
      {/* Container for track and stops */}
      <div className="relative h-32">
        {/* Track */}
        <div className="absolute top-1/2 left-0 w-full h-1 bg-neutral-600 -translate-y-1/2"></div>
        <div
          className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ width: `${(currentStep / (stopCount - 1)) * 100}%` }}
        ></div>

        {allStops.map((stop, index) => {
          const pos = getStopPosition(index);
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={stop.id}>
              {/* Circle */}
              <div
                className={`absolute rounded-full transition-all duration-900 ease-in-out ${isCompleted ? "bg-blue-600 w-4 h-4" : isActive ? "bg-blue-600 w-4 h-4" : "bg-neutral-600 w-4 h-4"
                  }`}
                style={{
                  left: `${pos}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              ></div>

              {/* Label (absolutely positioned so it doesn't affect layout) */}
              <div
                className="absolute text-center text-xs w-32"
                style={{
                  left: `${pos}%`,
                  top: '65%', // a little below the track
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="font-semibold">{stop.location}</div>
                {stop.appointment_time || stop.window_start ? (
                  <div className="text-gray-500">{formatTime(stop)}</div>
                ) : null}
              </div>
            </div>
          );
        })}

        {/* Truck */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
          style={{ left: `${getStopPosition(currentStep)}%` }}
        >
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 w-8 h-8 rounded-full bg-blue-600 -z-10" />

            <AnimatePresence mode="wait">
              {currentStep === stopCount - 1 ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <FileText className="w-5 h-5 text-white" />
                </motion.div>
              ) : (
                <motion.div
                  key="truck"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Truck className="w-5 h-5 text-white" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls for demo */}
      <div className="flex justify-between mt-8">
        <Button
          onClick={() => setCurrentStep((s) => Math.max(s - 1, 0))}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Prev
        </Button>
        <Button
          onClick={() => setCurrentStep((s) => Math.min(s + 1, stopCount - 1))}
          className="px-4 py-2 bg-gray-200 rounded"
        >
          Next
        </Button>
      </div>
    </div>
  );
}
