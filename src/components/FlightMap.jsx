// frontend/src/components/FlightMap.jsx
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { metersPerSecToMph, metersToFeet } from "../utils";

import "./FlightMap.css";

const GLOBAL_VIEW = {
  center: [-98.5795, 39.8283], // Default center (North America)
  zoom: 2.2,
  pitch: 0,
  bearing: 0,
};

// Function to update flight location and heading
function updateFlightTelemetry(flightMarker, newLngLat, newHeading) {
  flightMarker.setLngLat(newLngLat);
  flightMarker.setRotation(newHeading);
}

// Get dynamic tooltip content
const createTooltipContent = (flight, heading) => {
  const altitude = metersToFeet(flight.altitude || 0);
  const velocity = metersPerSecToMph(flight.velocity || 0);

  const flightRouteLink = flight.callsign && flight.callsign !== "UNKNOWN"
    ? `https://www.flightaware.com/live/flight/${flight.callsign}`
    : "https://www.flightaware.com";

  // Tooltip content
  return `
    <div class="flight-tooltip-content">
      <div class="flight-tooltip-header">
        <div class="flight-tooltip-title">
          <img src="./light_plane.png" alt="Plane" />
          <span>${flight.callsign || "UNKNOWN"}</span>
        </div>
        <span class="flight-tooltip-title-right" style="">${flight.icao24.toUpperCase()}</span>
      </div>
      <div class="flight-tooltip-details">
        <div>Ground Speed: <span>${velocity} mph</span></div>
        <div>Altitude: <span>${altitude} ft</span></div>
        <div>Heading: <span>${heading}°</span></div>
        <div class="flight-route-container">
          <a href=${flightRouteLink} target="_blank" rel="noopener noreferrer" class="flight-route-link">
            See Route on FlightAware
          </a>
        </div>
      </div>
    </div>
  `;
};

export default function LiveMap({ flights, flightsCache, searchQuery }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const tooltipRef = useRef(null);
  const markersRef = useRef({});

  const activeFlightIdRef = useRef(null); // Keep clicked flight ID in memory for tooltip updates
  const [isMapReady, setIsMapReady] = useState(false);
  const prevSearchQueryRef = useRef(searchQuery);

  // Mount the maplibregl container canvas once on initial load
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Explicitly point to worker location (needed for MapLibre GL JS v6 + Vite)
    maplibregl.setWorkerUrl(workerUrl);

    // Initialize map
    mapRef.current = new maplibregl.Map({
      container: mapContainerRef.current,
      style: "https://tiles.openfreemap.org/styles/positron", // liberty OpenFreeMap © OpenMapTiles Data from OpenStreetMap
      center: [-98.5795, 39.8283], // Center over North America by default
      zoom: 3,
      maxZoom: 12,
      fadeDuration: 0,
      dragRotate: false,
      pitchWithRotate: false,
      pixelRatio: Math.min(window.devicePixelRatio, 1.5), // Cuts Retina GPU fill-rate load in half
      antialias: false, // Removes expensive multi-sample anti-aliasing passes on full-screen WebGL
    });

    // Initialize one reusable tooltip
    tooltipRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false, // prevent random background clicks from breaking sync
      className: "flight-tooltip",
      offset: 12,
    });

    // Bind single click listener to the global map root context
    // Needed to eliminate timing race conditions across marker updates
    mapRef.current.on("click", (e) => {
      const target = e.originalEvent.target.closest(".marker-wrapper"); // selects closets element matching class
      // if the user clicks empty map background, close tooltip
      if (!target) {
        if (tooltipRef.current.isOpen()) {
          tooltipRef.current.remove();
          activeFlightIdRef.current = null; // clear memory
        }
        return;
      }

      // if user clicks a marker, get the flight ID and corresponding flight data
      const targetId = target.getAttribute("data-flight-id");
      const targetFlight = flightsCache.current[targetId];

      if (!targetFlight) return;

      // Set flight ID ref
      activeFlightIdRef.current = targetId;

      // Set tooltip coords and other content
      const lat = parseFloat(targetFlight.latitude);
      const lng = parseFloat(targetFlight.longitude);
      const heading =
        targetFlight.heading !== undefined && targetFlight.heading !== null
          ? Math.round(targetFlight.heading || 0)
          : 0;

      tooltipRef.current
        .setLngLat([lng, lat])
        .setHTML(createTooltipContent(targetFlight, heading))
        .addTo(mapRef.current);
    });

    mapRef.current.on("load", () => {
      console.log("Map canvas style completely loaded and ready for markers.");
      setIsMapReady(true);
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, [flightsCache]);

  // Add/update incoming real-time markers outside main render step
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    const currentBatchIds = new Set();

    flights.forEach((flight) => {
      const { icao24, latitude, longitude } = flight;

      // Ensure there are numbers to pass to maplibregl coordinate arrays
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      if (isNaN(lat) || isNaN(lng)) {
        console.log(`Skipped item due to invalid telemetry metrics:`, flight);
        return;
      }

      currentBatchIds.add(icao24);

      const heading =
        flight.heading !== null && flight.heading !== undefined
          ? Math.round(flight.heading || 0)
          : 0;

      // If marker exists, update coordinates and heading without destroying DOM node
      if (markersRef.current[icao24]) {
        updateFlightTelemetry(markersRef.current[icao24], [lng, lat], heading);
        // If this specific plane is currently tracked, update its tooltip position
        // using fresh, non-stale payload data directly from this cycle
        if (
          tooltipRef.current.isOpen() &&
          activeFlightIdRef.current === icao24
        ) {
          tooltipRef.current
            .setLngLat([lng, lat])
            .setHTML(createTooltipContent(flight, heading));
        }
      } else {
        // if marker does not exist, create a new DOM node and add to map
        const outerEl = document.createElement("div");
        outerEl.className = "marker-wrapper";
        // Bind the tracking key to an immutable DOM attribute for click interception
        outerEl.setAttribute("data-flight-id", icao24);
        const innerEl = document.createElement("div");
        innerEl.className = "flight-marker";

        outerEl.appendChild(innerEl);

        // Create marker and add to map
        const marker = new maplibregl.Marker({
          element: outerEl,
          rotation: heading,
          rotationAlignment: "map", // 'map' value locks rotation to north
        })
          .setLngLat([lng, lat])
          .addTo(mapRef.current);

        markersRef.current[icao24] = marker;
      }
    });

    // Clean up expired markers and flight refs (planes that have stopped transmitting)
    Object.keys(markersRef.current).forEach((id) => {
      if (!currentBatchIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
        if (activeFlightIdRef.current === id) {
          tooltipRef.current.remove();
          activeFlightIdRef.current = null;
        }
      }
    });
  }, [flights, isMapReady]);

  // Trigger zoom-out when a user clears the search bar
  useEffect(() => {
    const map = mapRef.current;
    const hadPreviousSearch = prevSearchQueryRef.current.trim() !== "";

    // Update ref for the next render
    prevSearchQueryRef.current = searchQuery;

    // Only zoom out if the user actually cleared a previous search
    if (map && hadPreviousSearch && searchQuery === "") {
      map.flyTo({
        ...GLOBAL_VIEW,
        duration: 1800,
        curve: 1.42,
        essential: true,
      });
    }
  }, [searchQuery]);

  // Auto-frame filtered results when typing in the search bar
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !searchQuery || flights.length === 0) return;

    // Build a bounding box covering all currently matching aircraft
    const bounds = new maplibregl.LngLatBounds();
    flights.forEach((flight) => {
      if (flight.longitude && flight.latitude) {
        bounds.extend([flight.longitude, flight.latitude]);
      }
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 80, // Leave room around the outer markers
        maxZoom: 7, // Prevents zooming in too aggressively on a single plane
        duration: 1200,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]); // REMOVED 'flights' here so background updates never interrupt drags

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
