"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function TruckRouteMap({ stops, progress = 0, showTruck = true }) {
  const { theme } = useTheme();
  const mapContainer = useRef(null);
  const styleUrl =
    theme === "dark"
      ? "mapbox://styles/angel-dom/cmez8t10k011701ssgj5uco9c"
      : "mapbox://styles/angel-dom/cmfsxqoz900a301s0gzp917we";

  useEffect(() => {
    if (stops.length < 2) return;

    // Track if the component has unmounted to abort async tasks safely
    let isMounted = true;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [stops[0].lng, stops[0].lat],
      zoom: 4,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.addControl(new mapboxgl.FullscreenControl(), "top-right");
    map.addControl(
      new mapboxgl.ScaleControl({ maxWidth: 100, unit: "imperial" }),
      "bottom-right"
    );

    map.on("load", () => {
      const coordinates = stops.map((s) => `${s.lng},${s.lat}`).join(";");
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?geometries=geojson&overview=full&steps=true&annotations=distance&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          // If the component unmounted while fetching, break out early
          if (!isMounted) return;
          if (!data.routes || data.routes.length === 0) return;

          const route = data.routes[0];

          // Route line
          map.addSource("route", {
            type: "geojson",
            data: {
              type: "Feature",
              geometry: route.geometry,
            },
          });

          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#0074D9", "line-width": 5 },
          });

          // 🚛 Truck position (STOP-BASED PROGRESS)
          if (showTruck) {
            map.loadImage(
              "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/resources/lorry_low.png",
              (err, image) => {
                if (err || !isMounted) return;
                map.addImage("truck-icon", image);

                const legs = route.legs;
                const maxLegIndex = legs.length - 1;
                const clampedProgress = Math.max(0, Math.min(progress, legs.length - 1e-6));

                const legIndex = Math.floor(clampedProgress);
                const legProgress = clampedProgress - legIndex;
                const steps = legs[Math.min(legIndex, maxLegIndex)].steps;
                const legCoords = steps.flatMap((step) => step.geometry.coordinates);
                const pointIndex = Math.floor(legProgress * (legCoords.length - 1));
                const truckCoord = legCoords[pointIndex];

                map.addSource("truck", {
                  type: "geojson",
                  data: {
                    type: "FeatureCollection",
                    features: [
                      {
                        type: "Feature",
                        geometry: {
                          type: "Point",
                          coordinates: truckCoord,
                        },
                      },
                    ],
                  },
                });

                map.addLayer({
                  id: "truck-layer",
                  type: "symbol",
                  source: "truck",
                  layout: {
                    "icon-image": "truck-icon",
                    "icon-size": 0.8,
                    "icon-allow-overlap": true,
                  },
                });
              }
            );
          }

          // Waypoints
          const features = stops.map((stop) => ({
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [stop.lng, stop.lat],
            },
            properties: { label: stop.type || "Stop" },
          }));

          map.addSource("waypoints", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features,
            },
          });

          map.loadImage(
            "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/resources/pushpin_blue_low.png",
            (err, image) => {
              if (err || !isMounted) return;
              map.addImage("custom-marker", image);

              map.addLayer({
                id: "waypoints-layer",
                type: "symbol",
                source: "waypoints",
                layout: {
                  "icon-image": "custom-marker",
                  "text-field": ["get", "label"],
                  "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                  "text-offset": [0, 1.5],
                  "text-anchor": "bottom",
                  "icon-allow-overlap": true,
                },
                paint: {
                  "text-color": "#ffffff",
                  "text-halo-color": "#444444",
                  "text-halo-width": 1,
                },
              });
            }
          );

          // Fit bounds
          const bounds = new mapboxgl.LngLatBounds();
          stops.forEach((stop) => bounds.extend([stop.lng, stop.lat]));
          map.fitBounds(bounds, { padding: 50 });

          // Satellite toggle
          map.addSource("mapbox-satellite", {
            type: "raster",
            tiles: [
              `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxgl.accessToken}`,
            ],
            tileSize: 256,
          });

          map.addLayer(
            {
              id: "satellite",
              type: "raster",
              source: "mapbox-satellite",
              layout: { visibility: "none" },
            },
            "route"
          );

          // FIX 1: Add a optional chain check to ensure mapContainer.current isn't null
          const existingButton = mapContainer.current?.querySelector(".satellite-toggle-btn");
          if (existingButton) existingButton.remove();

          const toggleButton = document.createElement("button");
          toggleButton.className = "satellite-toggle-btn";
          toggleButton.textContent = "🛰️";
          toggleButton.style.position = "absolute";
          toggleButton.style.top = "145px";
          toggleButton.style.right = "10px";
          toggleButton.style.width = "29px";
          toggleButton.style.height = "29px";
          toggleButton.style.background = "#fff";
          toggleButton.style.borderRadius = "4px";
          toggleButton.style.cursor = "pointer";
          toggleButton.style.zIndex = 1;
          toggleButton.style.boxShadow = "rgba(0, 0, 0, 0.1) 0px 0px 0px 2px";

          toggleButton.onclick = () => {
            const visibility = map.getLayoutProperty("satellite", "visibility");
            map.setLayoutProperty(
              "satellite",
              "visibility",
              visibility === "visible" ? "none" : "visible"
            );
          };

          map.getContainer().appendChild(toggleButton);
        })
        .catch((err) => console.error("Mapbox Directions API error:", err));
    });

    return () => {
      isMounted = false; // Flag to stop any running images/fetches from updating state
      map.remove();
    };
  }, [stops, progress, theme]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        position: "relative",
      }}
    />
  );
}