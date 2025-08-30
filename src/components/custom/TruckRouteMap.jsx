"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function TruckRouteMap({ stops }) {
  const mapContainer = useRef(null);

  useEffect(() => {
    if (stops.length < 2) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/angel-dom/cmexufb0a004r01s6cgjrda2s",
      center: [stops[0].lng, stops[0].lat],
      zoom: 4,
      attributionControl: false
    });

    const coordinates = stops.map(s => `${s.lng},${s.lat}`).join(";");
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?geometries=geojson&overview=full&steps=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}`;

    map.on("load", () => {
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const route = data.routes[0].geometry;

          // Add route line
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", geometry: route },
          });

          map.addLayer({
            id: "route",
            type: "line",
            source: "route",
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "#0074D9", "line-width": 5 },
          });
          map.loadImage(
            "https://bxporjcib7gy7ljf.public.blob.vercel-storage.com/resources/marker.png",
            function (error, image) {
              if (error) throw error;
              map.addImage("custom-marker", image);
              map.addSource("waypoints", {
                type: "geojson",
                data: {
                  type: "FeatureCollection",
                  features: data.waypoints.map((wp, i) => ({
                    type: "Feature",
                    geometry: { type: "Point", coordinates: wp.location },
                    properties: { id: i },
                  })),
                },
              });
              map.addLayer({
                id: "waypoints-layer",
                type: "symbol", // or "symbol" if you want icons
                source: "waypoints",
                'layout': {
                  'icon-image': 'custom-marker',
                  // get the title name from the source's "title" property
                  'text-field': ['get', 'title'],
                  'text-font': [
                    'Open Sans Semibold',
                    'Arial Unicode MS Bold'
                  ],
                  'text-offset': [0, 1.25],
                  'text-anchor': 'bottom'
                }
              });
            })


          // Fit map to show all waypoints
          const bounds = new mapboxgl.LngLatBounds();
          data.waypoints.forEach(wp => bounds.extend(wp.location));
          map.fitBounds(bounds, { padding: 50 });
        })
        .catch(err => console.error("Mapbox Directions API error:", err));
    });

    return () => map.remove();
  }, [stops]);

  return <div ref={mapContainer} style={{ width: "100%", height: "300px" }} />;
}
