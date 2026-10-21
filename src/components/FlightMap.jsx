// frontend/src/components/FlightMap.jsx
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

const imagePath = `${import.meta.env.BASE_URL}dark_airplane.png`;

// Function to update flight location and heading
function updateFlightTelemetry(flightMarker, newLngLat, newHeading) {
  flightMarker.setLngLat(newLngLat);
  flightMarker.setRotation(newHeading);
}

export default function LiveMap({ flights }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({}); // Fast pointer lookup hash for active markers
  const [isMapReady, setIsMapReady] = useState(false);

  // 1. Mount the maplibregl container canvas once on initial load
  useEffect(() => {
    if (!mapContainerRef.current) return;

    maplibregl.setWorkerUrl(workerUrl);

    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/bright", // OpenFreeMap © OpenMapTiles Data from OpenStreetMap
      center: [-98.5795, 39.8283], // Center over North America by default
      zoom: 3,
    });

    mapRef.current.on("load", () => {
      console.log("Map canvas style completely loaded and ready for markers.");
      setIsMapReady(true);
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  // 2. Add/update incoming real-time markers outside main render step
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const currentBatchIds = new Set();

    flights.forEach((flight) => {
      const { heading, icao24, latitude, longitude, callsign } = flight;

      // Ensure there are numbers to pass to maplibregl coordinate arrays
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.log(`Skipped item due to invalid telemetry metrics:`, flight);
        return;
      }

      currentBatchIds.add(icao24);

      const rotationAngle =
        heading !== null && heading !== undefined ? heading : 0;

      // if marker exists, update coordinates and heading without destroying DOM node
      if (markersRef.current[icao24]) {
        updateFlightTelemetry(
          markersRef.current[icao24],
          [lng, lat],
          rotationAngle,
        );
      } else {
        // if marker does not exist, create a new DOM node and add to map
        const el = document.createElement("div");
        el.className = "flight-marker";
        el.style.width = "15px";
        el.style.height = "15px";
        el.style.backgroundImage = `url("${imagePath}")`;
        el.style.backgroundSize = "contain";
        el.style.cursor = "pointer";
        el.title = callsign;

        // Anchor to Mablibre instance
        const marker = new maplibregl.Marker({
          element: el,
          rotation: rotationAngle, // MapLibre rotates the element automatically
          rotationAlignment: "map", // 'map' locks rotation to north
        })
          .setLngLat([longitude, latitude])
          .addTo(mapRef.current);

        markersRef.current[icao24] = marker;
      }
    });

    // Clean up expired markers (planes that have stopped transmitting)
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentBatchIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });
  }, [flights, isMapReady]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        overflow: "hidden",
      }}
    />
  );
}
