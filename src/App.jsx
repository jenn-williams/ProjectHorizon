import { memo, useEffect, useRef, useState } from "react";
import FlightList from "./components/FlightList";
import FlightMap from "./components/FlightMap";

import "./App.css";

// Search bar with internal ref to guarantee focus retention of cursor
const SearchBar = memo(({ value, onChange, onClear }) => {
  const inputRef = useRef(null);

  // Maintain focus lock on update
  useEffect(() => {
    if (document.activeElement === inputRef.current) {
      const frame = requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [value]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        paddingLeft: "20px",
      }}
    >
      <input
        ref={inputRef}
        key="stable-flight-search-input"
        type="text"
        placeholder="Search Callsign (ex: SWA123)..."
        value={value}
        onChange={(e) =>
          onChange(e.target.value.toUpperCase().replace(/\s/g, ""))
        }
        style={{
          backgroundColor: "#334155",
          border: "1px solid #475569",
          borderRadius: "6px",
          color: "#f8fafc",
          fontSize: "0.9rem",
          padding: "8px 12px",
          width: "240px",
          outline: "none",
        }}
      />
      {value && (
        <button
          onClick={onClear}
          style={{
            position: "absolute",
            right: "10px",
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "0.85rem",
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
});

SearchBar.displayName = "SearchBar";

function App() {
  const [flights, setFlights] = useState([]);
  const flightsCacheRef = useRef({}); // Keep cache of current flight data
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const workerRef = useRef(null);
  const wsRef = useRef(null);

  const filteredFlights = searchQuery
    ? flights.filter((f) => f.callsign?.toUpperCase().includes(searchQuery))
    : flights;

  useEffect(() => {
    // Initialize worker for data processing
    workerRef.current = new Worker(
      new URL("./workers/dataProcessor.worker.js", import.meta.url),
      { type: "module" },
    );

    // Listen for processed data from worker
    workerRef.current.onmessage = (event) => {
      if (event.data.type === "DATA_PROCESSED") {
        setFlights(event.data.telemetry);
        flightsCacheRef.current = event.data.cache;
      }
    };

    // WebSocket logic wrapper
    const connectWebSocket = () => {
      console.log("Connecting to FastApi Websocket server...");
      // Open Websocker connection to BE
      const ws = new WebSocket("ws://localhost:8000/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Successful connection to FastApi Websocket server!");
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "FLIGHT_DATA" && workerRef.current) {
          // Offload data parsing to worker thread
          workerRef.current.postMessage({
            type: "PROCESS_TELEMETRY",
            rawData: payload.data,
          });
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting in 5 seconds...");
        setIsConnected(false);
        // Retry connection after 5 seconds to allow server to reboot
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = () => {
        // Suppress any noisy errors while server is booting up
        console.log("Waiting for server...");
      };
    };

    connectWebSocket();

    // Clean up on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const flightCount = searchQuery ? `${filteredFlights.length} of ${flights.length}` : `${flights.length}`;

  return (
    <>
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          fontFamily: "sans-serif",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          position: "relative",
          width: "100vw",
        }}
      >
        <header
          style={{
            alignItems: "center",
            boxShadow: "0 2px 4px rgba(0,0,0,2)",
            boxSizing: "border-box",
            color: "#f8fafc",
            display: "flex",
            height: "60px",
            justifyContent: "space-between",
            padding: "0 20px",
            width: "100%",
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "600" }}>
              {`SkyTracker Ingestion Engine (${flightCount} Total Flights)`}
            </h1>
            <span
              style={{
                backgroundColor: isConnected ? "#10b981" : "#ef4444",
                borderRadius: "50%",
                display: "inline-block",
                height: "10px",
                marginLeft: "10px",
                width: "10px",
              }}
              title={isConnected ? "WebSocket Connected" : "Disconnected"}
            />
          </div>
          <div style={{ display: "flex" }}>
            <nav style={{ display: "flex", alignItems: "center" }}>
              <a
                className="about-pg-link"
                href="#"
              >
                About
              </a>
            </nav>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery("")}
            />
          </div>
        </header>
        {isConnected && flights.length > 0 ? (
          <div
            style={{
              display: "flex",
              flex: 1,
              height: "calc(100vh - 60px)",
              position: "relative",
              width: "100%",
            }}
          >
            <div
              style={{
                borderRight: "1px solid #ccc",
                boxSizing: "border-box",
                height: "100%",
                width: "30%",
              }}
            >
              <FlightList flights={filteredFlights} />
            </div>
            <div
              style={{
                boxSizing: "border-box",
                height: "100%",
                position: "relative",
                width: "70%",
              }}
            >
              <FlightMap
                flights={filteredFlights}
                flightsCache={flightsCacheRef}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              flex: 1,
              justifyContent: "center",
              width: "100%",
            }}
          >
            <div className="flight-universe">
              <div className="flight-zone">
                <svg className="flight-svg" viewBox="0 0 450 350">
                  <defs>
                    <linearGradient
                      id="perfectRouteGradient"
                      gradientUnits="userSpaceOnUse"
                      x1="170"
                      y1="230"
                      x2="210"
                      y2="230"
                    >
                      <stop offset="0%" stopColor="#334155" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#ffffff" />
                    </linearGradient>
                  </defs>
                  <path
                    className="flight-path"
                    d="M 150,165 a 130,65 0 1,0 0.1,0 Z"
                  />
                  <g className="airplane">
                    <image
                      href="./plane.svg"
                      width="150"
                      height="150"
                      x="-75"
                      y="-75"
                    />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
