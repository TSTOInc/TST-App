"use client";
import React, { useState, useEffect } from "react";
import DownloadInvoiceButton from "@/components/custom/DownloadInvoice";
import Loading from "@/components/custom/Loading";
import TruckRouteMap from "@/components/custom/TruckRouteMap";
import StopsProgressBar from "@/components/custom/StopsProgressBar";

function mapStepToProgress(currentStep, allStopsLength) {
  const lastStep = allStopsLength - 1;

  if (currentStep <= 1) return 0;
  if (currentStep >= lastStep - 1) return 1;

  const intermediateSteps = lastStep - 2;
  const stepIndex = currentStep - 1;
  return stepIndex / intermediateSteps;
}

export default function Page({ params }) {
  const { id } = React.use(params);

  // ✅ Initialize directly from localStorage if available
  const getInitialStep = () => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(`load-progress-step-${id}`);
    return saved !== null ? Number(saved) : 0;
  };

  const getInitialProgress = () => {
    if (typeof window === "undefined") return 0;
    const saved = localStorage.getItem(`load-progress-${id}`);
    return saved !== null ? Number(saved) : 0;
  };

  const [data, setData] = useState(null);
  const [stopsWithCoords, setStopsWithCoords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentStep, setCurrentStep] = useState(getInitialStep);
  const [progress, setProgress] = useState(getInitialProgress);

  // ✅ Recalculate progress when step changes
  useEffect(() => {
    if (!stopsWithCoords.length) return;

    const newProgress = mapStepToProgress(
      currentStep,
      stopsWithCoords.length + 3
    );
    setProgress(newProgress);

    localStorage.setItem(`load-progress-step-${id}`, String(currentStep));
    localStorage.setItem(`load-progress-${id}`, String(newProgress));

    console.log(`Step changed: ${currentStep}, Progress: ${newProgress}`);
  }, [currentStep, stopsWithCoords, id]);

  // Function to geocode an address into [lng, lat]
  const geocodeAddress = async (address) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].geometry.coordinates;
    }
    throw new Error(`Could not geocode address: ${address}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://tst.api.incashy.com/get/loads/${id}`, {
          cache: "no-cache",
        });
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setData(data);

        // Geocode all stops
        if (data.stops && data.stops.length > 0) {
          const stopsWithCoordinates = await Promise.all(
            data.stops.map(async (stop) => {
              const coords = await geocodeAddress(stop.location);
              return { ...stop, coordinates: coords };
            })
          );
          setStopsWithCoords(stopsWithCoordinates);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500">Error: {error}</div>;
  if (!data) return <div>No carrier data found</div>;
  console.log("Current step:", currentStep);
  return (
    <div>
      {stopsWithCoords.length > 0 && (
        <TruckRouteMap
          stops={stopsWithCoords.map((stop) => ({
            lat: stop.coordinates[1],
            lng: stop.coordinates[0],
          }))}
          progress={progress}
        />
      )}
      <div className="px-4">
        <StopsProgressBar
          stops={data.stops}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
        <br />
        <DownloadInvoiceButton data={data} />
      </div>
    </div>
  );
}
