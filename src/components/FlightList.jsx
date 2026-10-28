import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { metersPerSecToMph, metersToFeet } from "../utils";

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

  return (
    <div
      ref={parentRef}
      className="FlightListContainer"
      style={{
        height: "calc(100% - 45px)", // add space for header
        overflow: "auto",
        width: "100%",
      }}
    >
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
          const heading = flight.heading !== null && flight.heading !== undefined ? Math.round(flight.heading || 0) : 0;
          const altitude = metersToFeet(flight.altitude || 0);
          const velocity = metersPerSecToMph(flight.velocity || 0);

          // find better way to handle when actual count is above estimate
          // currently this causes extra space at the bottom of list when using
          // the live data
          return flight && (
            <div
              key={virtualRow.index}
              className=""
              style={{
                border: "1px solid #eee",
                height: `${virtualRow.size}px`,
                left: 0,
                position: "absolute",
                top: 0,
                transform: `translateY(${virtualRow.start}px)`,
                width: "100%",
              }}
            >
              <div
                style={{
                  color: "#fff",
                  fontWeight: "bold",
                  paddingTop: "5px",
                  paddingLeft: "5px",
                }}
              >
                ✈️ Flight: {flight.callsign} - {flight.country}
              </div>
              <div
                style={{
                  color: "#6b7280",
                  fontSize: "11px",
                  paddingLeft: "5px",
                }}
              >
                Alt: {altitude} ft | Ground Speed: {velocity} mph | Long: {isNaN(lng) ? 'N/A' : lng}{" "}
                Lat: {isNaN(lat) ? 'N/A' : lat} | Heading: {heading}°
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
