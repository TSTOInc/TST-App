"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function TruckRouteMap({ stops, progress }) {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (stops.length < 2) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/angel-dom/cmez8t10k011701ssgj5uco9c",
      center: [stops[0].lng, stops[0].lat],
      zoom: 4,
      attributionControl: false,
    });

    const coordinates = stops.map((s) => `${s.lng},${s.lat}`).join(";");
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

    map.on("load", () => {
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

          // Add a truck icon
          map.loadImage(
            "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/resources/lorry_low.png",
            (err, image) => {
              if (err) throw err;
              map.addImage("truck-icon", image);
              const totalPoints = route.coordinates.length;
              const index = Math.floor(progress * (totalPoints - 1));
              const truckCoord = route.coordinates[index];
              const truckFeature = {
                type: "FeatureCollection",
                features: [{ type: "Feature", geometry: { type: "Point", coordinates: truckCoord } }],
              };
              map.addSource("truck", { type: "geojson", data: truckFeature });
              map.addLayer({
                id: "truck-layer",
                type: "symbol",
                source: "truck",
                layout: { "icon-image": "truck-icon", "icon-size": 0.8, "icon-allow-overlap": true },
              });
            }
          );

          // Waypoints with stop type label
          const features = stops.map((stop, i) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
            properties: { label: stop.type || "Stop" },
          }));

          map.addSource("waypoints", { type: "geojson", data: { type: "FeatureCollection", features } });

          // Load custom marker
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
                  "text-field": ["get", "label"],
                  "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
                  "text-offset": [0, 1.5],
                  "text-anchor": "bottom",
                },
                paint: {
                  "text-color": "#ffffff",
                  "text-halo-color": "#444444", 
                  "text-halo-width": 1,        
                },
              });
            }
          );

          // Fit map to bounds
          const bounds = new mapboxgl.LngLatBounds();
          stops.forEach((stop) => bounds.extend([stop.lng, stop.lat]));
          map.fitBounds(bounds, { padding: 50 });
        })
        .catch((err) => console.error("Mapbox Directions API error:", err));
    });

    return () => map.remove();
  }, [stops, progress]);

  return <div ref={mapContainer} style={{ width: "100%", height: "300px" }} />;
}
