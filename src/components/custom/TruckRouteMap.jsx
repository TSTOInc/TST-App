"use client";

import { useTheme } from "@/components/theme-provider";
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function TruckRouteMap({ stops, progress }) {
  const { theme } = useTheme();
  const mapContainer = useRef(null);
  const styleUrl =
    theme === "dark"
      ? "mapbox://styles/angel-dom/cmez8t10k011701ssgj5uco9c" // your dark style
      : "mapbox://styles/angel-dom/cmfsxqoz900a301s0gzp917we"; // your light style
  useEffect(() => {
    if (stops.length < 2) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: styleUrl,
      center: [stops[0].lng, stops[0].lat],
      zoom: 4,
      attributionControl: false,
    });

    // ✅ Add built-in controls
    map.addControl(new mapboxgl.NavigationControl(), "top-right"); // zoom + rotation
    map.addControl(new mapboxgl.FullscreenControl(), "top-right"); // fullscreen
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 100, unit: "imperial" }), "bottom-right"); // scale bar


    map.on("load", () => {
      const coordinates = stops.map((s) => `${s.lng},${s.lat}`).join(";");
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          const route = data.routes[0].geometry;

          // Route line
          map.addSource("route", { type: "geojson", data: { type: "Feature", geometry: route } });
          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#0074D9", "line-width": 5 },
          });

          // Truck icon
          map.loadImage(
            "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/resources/lorry_low.png",
            (err, image) => {
              if (err) throw err;
              map.addImage("truck-icon", image);
              const totalPoints = route.coordinates.length;
              const index = Math.floor(progress * (totalPoints - 1));
              const truckCoord = route.coordinates[index];
              map.addSource("truck", {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: [{ type: "Feature", geometry: { type: "Point", coordinates: truckCoord } }],
                },
              });
              map.addLayer({
                id: "truck-layer",
                type: "symbol",
                source: "truck",
                layout: { "icon-image": "truck-icon", "icon-size": 0.8, "icon-allow-overlap": true },
              });
            }
          );

          // Waypoints
          const features = stops.map((stop) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
            properties: { label: stop.type || "Stop" },
          }));
          map.addSource("waypoints", { type: "geojson", data: { type: "FeatureCollection", features } });

          map.getStyle().glyphs ||= "mapbox://fonts/mapbox/{fontstack}/{range}.pbf";

          map.loadImage(
            "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/resources/pushpin_blue_low.png",
            (err, image) => {
              if (err) throw err;
              map.addImage("custom-marker", image);
              map.addLayer({
                id: "waypoints-layer",
                type: "symbol",
                source: "waypoints",
                layout: {
                  "icon-image": "custom-marker",
                  "text-field": ["get", "label"],  // keep your labels
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

          // ✅ Add Satellite toggle
          map.addSource("mapbox-satellite", {
            type: "raster",
            tiles: [
              `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${mapboxgl.accessToken}`,
            ],
            tileSize: 256,
          });
          map.addLayer(
            { id: "satellite", type: "raster", source: "mapbox-satellite", layout: { visibility: "none" } },
            "route" // place below route layer
          );

          // ✅ Simple button to toggle satellite layer
          const toggleButton = document.createElement("button");
          toggleButton.style.color = "black";
          toggleButton.style.cursor = "pointer";
          toggleButton.style.borderRadius = "4px";
          toggleButton.textContent = "🛰️";
          toggleButton.style.position = "absolute";
          toggleButton.style.top = "10px";
          toggleButton.style.left = "10px";
          toggleButton.style.zIndex = 1;
          toggleButton.style.background = "#fff";
          toggleButton.style.padding = "5px 10px";
          toggleButton.style.border = "1px solid #ccc";
          toggleButton.onclick = () => {
            const visibility = map.getLayoutProperty("satellite", "visibility");
            map.setLayoutProperty("satellite", "visibility", visibility === "visible" ? "none" : "visible");
          };
          map.getContainer().appendChild(toggleButton);

          // ✅ 3D Buildings button
          const threeDButton = document.createElement("button");
          threeDButton.style.color = "black";
          threeDButton.style.cursor = "pointer";
          threeDButton.style.fontWeight = "bold";
          threeDButton.style.borderRadius = "4px";
          threeDButton.textContent = "🏙️ 3D";
          threeDButton.style.position = "absolute";
          threeDButton.style.top = "50px";
          threeDButton.style.left = "10px";
          threeDButton.style.zIndex = 1;
          threeDButton.style.background = "#fff";
          threeDButton.style.padding = "5px 10px";
          threeDButton.style.border = "1px solid #ccc";
          threeDButton.onclick = () => {
            if (!map.getLayer("3d-buildings")) {
              map.addLayer({
                id: "3d-buildings",
                source: "composite",
                "source-layer": "building",
                filter: ["==", "extrude", "true"],
                type: "fill-extrusion",
                minzoom: 15,
                paint: {
                  "fill-extrusion-color": "#aaa",
                  "fill-extrusion-height": ["get", "height"],
                  "fill-extrusion-base": ["get", "min_height"],
                  "fill-extrusion-opacity": 0.6,
                },
              });
            } else {
              map.removeLayer("3d-buildings");
            }
          };
          map.getContainer().appendChild(threeDButton);
        })
        .catch((err) => console.error("Mapbox Directions API error:", err));
    });

    return () => map.remove();
  }, [stops, progress, theme]);

  return <div ref={mapContainer} style={{ width: "100%", height: "400px", position: "relative" }} />;
}
