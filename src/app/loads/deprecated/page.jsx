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

  useEffect(() => {
    if (!stopsWithCoords.length) return;
    const newProgress = mapStepToProgress(currentStep, stopsWithCoords.length + 3);
    setProgress(newProgress);
    localStorage.setItem(`load-progress-step-${id}`, String(currentStep));
    localStorage.setItem(`load-progress-${id}`, String(newProgress));
  }, [currentStep, stopsWithCoords, id]);

  const geocodeAddress = async (address) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      address
    )}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Geocoding failed");
    const data = await res.json();
    if (data.features && data.features.length > 0) return data.features[0].geometry.coordinates;
    throw new Error(`Could not geocode address: ${address}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/get/loads/${id}`, {
          cache: "no-cache",
        });
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
        setData(data);

        if (data.stops && data.stops.length > 0) {
          const stopsWithCoordinates = await Promise.all(
            data.stops.map(async (stop) => {
              const coords = await geocodeAddress(stop.location);
              return {
                ...stop,
                coordinates: coords,
                lat: coords[1],
                lng: coords[0],
                type: stop.type.slice(0, 1).toUpperCase() + stop.type.slice(1), // pass type to map
              };
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

  return (
    <div>
      {stopsWithCoords.length > 0 && (
        <TruckRouteMap stops={stopsWithCoords} progress={progress} />
      )}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 text-2xl sm:text-3xl font-bold">
            <h1>Invoice {data.invoice_number || "N/A"}</h1>
            <h1>•</h1>
            <h1>Load {data.load_number || "N/A"}</h1>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold">${data.rate || "N/A"}</h1>
        </div>

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
