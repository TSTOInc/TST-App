"use client";
import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimePicker } from "@/components/add-load/DateTimePicker";
import { MapPin, Plus, Trash } from "lucide-react";
import TruckRouteMap from "@/components/custom/TruckRouteMap";

// ---------------------- GEOCODING HELPER ----------------------
const geocodeAddress = async (address: string) => {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
    address
  )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Geocoding failed");

  const data = await res.json();
  if (data.features && data.features.length > 0)
    return data.features[0].geometry.coordinates;

  throw new Error(`Could not geocode address: ${address}`);
};

// ---------------------- COMPONENT ----------------------
interface StopsStepProps {
  control: any;
  errors: any;
  stops: any[];
  canAddStop: boolean;
  canRemoveStop: boolean;
  append: (value: any) => void;
  remove: (idx: number) => void;
  fields: any[];
}

export default function StopsStep({
  control,
  errors,
  stops,
  canAddStop,
  canRemoveStop,
  append,
  remove,
  fields,
}: StopsStepProps) {
  const [stopsWithCoords, setStopsWithCoords] = useState<any[]>([]);
  const [loadingStops, setLoadingStops] = useState<boolean[]>([]);

  // ---------------------- HANDLE GEOCODE ON BLUR ----------------------
  const handleGeocode = async (idx: number, address: string) => {
    if (!address) return;

    // set loading true for this stop
    setLoadingStops((prev) => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });

    try {
      const coords = await geocodeAddress(address);
      setStopsWithCoords((prev) => {
        const copy = [...prev];
        copy[idx] = {
          ...stops[idx],
          coordinates: coords,
          lat: coords[1],
          lng: coords[0],
          type: stops[idx].type.charAt(0).toUpperCase() + stops[idx].type.slice(1),
        };
        return copy;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStops((prev) => {
        const copy = [...prev];
        copy[idx] = false;
        return copy;
      });
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* ---------------- LEFT SIDE ---------------- */}
      <div className="space-y-6 pr-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex gap-1"><Label className="text-lg">Stops</Label><Label className="text-muted-foreground">(min 2, max 10)</Label></div>
          <Button
            size="sm"
            type="button"
            onClick={() =>
              append({
                type: "pickup",
                location: "",
                timeType: "appointment",
                appointmentTime: undefined,
                windowStart: undefined,
                windowEnd: undefined,
              })
            }
            disabled={!canAddStop}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {fields.map((field, idx) => {
          const stop = stops[idx];

          return (
            <div
              key={field.id}
              className="grid grid-cols-[1fr_auto] gap-3 border-b border-foreground-muted pb-4"
            >
              <div className="space-y-3">
                {/* TYPE + LOCATION */}
                <div className="grid grid-cols-[auto_1fr] gap-3">
                  {/* TYPE */}
                  <Controller
                    name={`stops.${idx}.type`}
                    control={control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={async (value) => {
                          field.onChange(value);          // update form state
                          const stop = stops[idx];        // get current stop
                          if (stop.location) {            // only geocode if location exists
                            await handleGeocode(idx, stop.location);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[110px]">
                          <SelectValue>
                            {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />


                  {/* LOCATION */}
                  <Controller
                    name={`stops.${idx}.location`}
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="1890 Main St, City, State, ZIP"
                        autoComplete="off"
                        className={errors.stops?.[idx]?.location ? "border-red-600" : ""}
                        onBlur={(e) => handleGeocode(idx, e.target.value)}
                      />
                    )}
                  />
                </div>

                {/* TIME TYPE + DATE PICKER */}
                <div className="grid grid-cols-[auto_1fr] gap-3 w-full">
                  {/* TIME TYPE */}
                  <div>
                    <Controller
                      name={`stops.${idx}.timeType`}
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-[150px]">
                            <SelectValue>
                              {field.value.charAt(0).toUpperCase() + field.value.slice(1)}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="appointment">Appointment</SelectItem>
                            <SelectItem value="window">Time Window</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* DATE PICKER */}
                  <div>
                    {stop.timeType === "appointment" && (
                      <Controller
                        control={control}
                        name={`stops.${idx}.appointmentTime`}
                        render={({ field }) => (
                          <DateTimePicker value={field.value} onChange={field.onChange} label="Appointment" />
                        )}
                      />
                    )}

                    {stop.timeType === "window" && (
                      <Controller
                        control={control}
                        name={`stops.${idx}.windowStart`}
                        render={({ field }) => (
                          <DateTimePicker value={field.value} onChange={field.onChange} label="Window Start" />
                        )}
                      />
                    )}
                  </div>

                  <div />

                  {stop.timeType === "window" && (
                    <Controller
                      control={control}
                      name={`stops.${idx}.windowEnd`}
                      render={({ field }) => (
                        <DateTimePicker value={field.value} onChange={field.onChange} label="Window End" />
                      )}
                    />
                  )}
                </div>
              </div>

              {/* REMOVE BTN */}
              <Button
                size="sm"
                variant="destructive"
                type="button"
                onClick={() => {
                  remove(idx); // remove the stop
                  setStopsWithCoords((prev) => prev.filter((_, i) => i !== idx)); // remove from coords array
                  setLoadingStops((prev) => prev.filter((_, i) => i !== idx)); // remove loading state
                }}
                disabled={!canRemoveStop}
              >
                <Trash className="h-4 w-4" />
              </Button>

            </div>
          );
        })}
      </div>

      {/* ---------------- RIGHT SIDE MAP ---------------- */}
      <div className="relative">
        {stopsWithCoords.length > 0 ? (
          <TruckRouteMap stops={stopsWithCoords} showTruck={false} />
        ) : (
          <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center text-center space-y-2">
            <MapPin className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Interactive map will be displayed here</p>
          </div>
        )}

        {/* LOADING SPINNER */}
        {loadingStops.some((l) => l) && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}
