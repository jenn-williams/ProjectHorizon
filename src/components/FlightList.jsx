import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { metersPerSecToMph, metersToFeet } from "../utils";

import "./FlightList.css";

export default function FlightList({ flights }) {
  const parentRef = useRef(null);

  // List renders correctly, safe to disable lint error
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: (flights || []).length > 0 ? flights.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  if (flights.length === 0) {
    return (
      <div ref={parentRef} className="flight-list-container empty">
        <p>No flights found</p>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flight-list-container">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: "relative",
          width: "100%",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const flight = flights[virtualRow.index] || null;
          const lat = parseFloat(flight.latitude);
          const lng = parseFloat(flight.longitude);
          const heading =
            flight.heading !== null && flight.heading !== undefined
              ? Math.round(flight.heading || 0)
              : 0;
          const altitude = metersToFeet(flight.altitude || 0);
          const velocity = metersPerSecToMph(flight.velocity || 0);

          return (
            flight && (
              <div
                key={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
                className=""
                style={{
                  border: "1px solid #eee",
                  left: 0,
                  position: "absolute",
                  top: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                  width: "100%",
                }}
              >
                <div className="flight-title">
                  <img className="plane-icon" src="./light_plane.png" alt="Plane" />
                  Flight: {flight.callsign}
                </div>
                <div className="flight-info">
                  Alt: {altitude} ft | Ground Speed: {velocity} mph | Long:{" "}
                  {isNaN(lng) ? "N/A" : lng} | Lat: {isNaN(lat) ? "N/A" : lat} |
                  Heading: {heading}°
                </div>
              </div>
            )
          );
        })}
      </div>
    </div>
  );
}
