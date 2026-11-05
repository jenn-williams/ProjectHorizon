import { memo, useEffect, useRef, useState } from "react";
import FlightList from "./components/FlightList";
import FlightMap from "./components/FlightMap";
import PerformanceMonitor from "./components/PerformanceMonitor";

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
    <div className="search-bar-wrapper">
      <input
        ref={inputRef}
        key="stable-flight-search-input"
        type="text"
        placeholder="Search Callsign (ex: SWA123)..."
        value={value}
        onChange={(e) =>
          onChange(e.target.value.toUpperCase().replace(/\s/g, ""))
        }
        className="search-bar"
      />
      {value && (
        <button className="search-clear-button" onClick={onClear}>
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
        // Remove the onclose listener before closing
        // This prevents the old socket from triggering a reconnection loop
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const flightCount = searchQuery
    ? `${filteredFlights.length} of ${flights.length}`
    : `${flights.length}`;

  return (
    <>
      <div className="app-wrapper">
        <header className="app-bar">
          <div className="header-left">
            <h1 className="header-title">
              {`SkyTracker Ingestion Engine (${flightCount} Total Flights)`}
            </h1>
            <PerformanceMonitor />
          </div>
          <div className="header-right">
            <nav className="nav-wrapper">
              <a className="about-pg-link" href="#">
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
          <div className="content-wrapper">
            <div className="content-left">
              <FlightList flights={filteredFlights} />
            </div>
            <div className="content-right">
              <FlightMap
                flights={filteredFlights}
                flightsCache={flightsCacheRef}
              />
            </div>
          </div>
        ) : (
          <div className="loading-screen">
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
