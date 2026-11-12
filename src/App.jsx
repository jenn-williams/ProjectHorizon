import { memo, useEffect, useRef, useState } from "react";
import FlightList from "./components/FlightList";
import FlightMap from "./components/FlightMap";
import PerformanceMonitor from "./components/PerformanceMonitor";
import PlaneLoader from "./components/PlaneLoader";

import "./App.css";
import AboutPage from "./AboutPage";

// Search bar with internal ref to guarantee focus retention of cursor
const SearchBar = memo(({ disabled, onChange, onClear, value }) => {
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
        disabled={disabled}
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

const ERROR_TITLES = {
  RATE_LIMITED: "Rate Limit Exceeded",
  INVALID_CONSTRAINTS: "API Validation Error",
  UNKNOWN_DEGRADATION: "Data Stream Anomaly",
  AUTH_DENIED: "Authentication Error",
  DOWNSTREAM_CRASH: "OpenSky Service Unavailable",
  NETWORK_FAULT: "Network Interrupted",
  CONNECTION_LOST: "Data stream disconnected",
  INTERNAL_SYSTEM_FAULT: "Server Error",
};

function App() {
  const [flights, setFlights] = useState([]);
  const flightsCacheRef = useRef({}); // Keep cache of current flight data
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const workerRef = useRef(null);
  const wsRef = useRef(null);

  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [isTakingOff, setIsTakingOff] = useState(false);

  const [activeError, setActiveError] = useState(null);
  const isBlockingError = Boolean(activeError && flights.length === 0);

  const [currentPage, setCurrentPage] = useState("");

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
      console.log(event.data.type);
      if (event.data.type === "DATA_PROCESSED") {
        setFlights(event.data.telemetry);
        flightsCacheRef.current = event.data.cache;
      }
      if (event.data.type === "WORKER_ERROR") {
        setActiveError({
          title:
            ERROR_TITLES[event.data.error] || ERROR_TITLES.UNKNOWN_DEGRADATION,
          message: event.data.message,
        });
      }
    };

    // WebSocket logic wrapper
    const connectWebSocket = () => {
      console.log("Connecting to FastApi Websocket server...");
      // Open Websocker connection to BE
      const wsUrl = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Successful connection to FastApi Websocket server!");
        setIsConnected(true);
        setActiveError(null);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "FLIGHT_DATA" && workerRef.current) {
            setActiveError(null);
            // Offload data parsing to worker thread
            workerRef.current.postMessage({
              type: "PROCESS_TELEMETRY",
              rawData: payload.data,
            });
          }

          if (payload.type === "SERVER_ERROR") {
            setActiveError({
              title: ERROR_TITLES[payload.error] || "System Exception",
              message: payload.message,
            });
          }
        } catch {
          setActiveError({
            title: ERROR_TITLES.UNKNOWN_DEGRADATION,
            message: "Failed to process downstream data packets.",
          });
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting in 5 seconds...");
        setActiveError({
          title: ERROR_TITLES.CONNECTION_LOST,
          message: "Re-establishing link in 5 seconds...",
        });
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

  // Navigation
  useEffect(() => {
    // Function to sync component state with the URL hash location
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === "#about") {
        setCurrentPage("about");
      } else {
        setCurrentPage(""); // Fallback to main page
      }
    };

    // Run on initial mount to catch a direct link (e.g. ://yoursite.com)
    handleHashChange();

    // Listen for browser Back/Forward navigation shifts
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const flightCount = searchQuery
    ? `${filteredFlights.length} of ${flights.length}`
    : `${flights.length}`;

  // Defer rendering full flight data so animation can complete smoothly
  const visibleMapFlights = isAnimationComplete
    ? filteredFlights
    : filteredFlights.slice(0, 1000);

  // Any initial error exits to blur modal, subsequent errors will enter blur modal as well
  const isDataLoaded = Boolean(
    (isConnected && flights.length > 0) || Boolean(activeError),
  );

  const isHomePage = currentPage === "";

  return (
    <>
      <div className="app-wrapper">
        <header className="app-bar">
          <div className="header-left">
            <h1 className="header-title">
              <a className="pg-link" href="#">
                ProjectHorizon
              </a>
              {` (${flightCount} Total Flights)`}
            </h1>
            <PerformanceMonitor />
          </div>
          <div className="header-right">
            <nav className="nav-wrapper">
              <a className="pg-link" href="#about">
                About
              </a>
            </nav>
            <SearchBar
              disabled={!isHomePage || (activeError && isBlockingError)}
              value={searchQuery}
              onChange={setSearchQuery}
              onClear={() => setSearchQuery("")}
            />
          </div>
        </header>
        {isHomePage && (
          <>
            <div
              className={`content-wrapper ${isTakingOff ? "dashboard-reveal" : "dashboard-hidden"} ${isBlockingError ? "stale-state" : ""}`}
            >
              <div className="content-left">
                <FlightList flights={filteredFlights} />
              </div>
              <div className="content-right">
                <FlightMap
                  flights={visibleMapFlights}
                  flightsCache={flightsCacheRef}
                  searchQuery={searchQuery}
                />
              </div>
              {activeError && !isBlockingError && (
                <div className="error-toast-layer">
                  <div className="pulse-beacon" />
                  <div className="error-toast-content">
                    <span className="error-toast-title">
                      {`Showing cached data · ${activeError.title}`}:
                    </span>
                    <span className="error-toast-message">
                      {activeError.message}
                    </span>
                  </div>
                  <button
                    className="error-toast-dismiss"
                    onClick={() => setActiveError(null)}
                  >
                    x
                  </button>
                </div>
              )}
              {isBlockingError && (
                <div className="glass-recovery-modal">
                  <div className="pulse-beacon" />
                  <h3 className="modal-title">{activeError.title}</h3>
                  <p className="modal-message">{activeError.message}</p>
                </div>
              )}
            </div>
            {!isAnimationComplete && isHomePage && (
              <PlaneLoader
                isReady={isDataLoaded}
                onBreakoutStart={() => setIsTakingOff(true)}
                onTransitionComplete={() => setIsAnimationComplete(true)}
              />
            )}
          </>
        )}
        {currentPage === "about" && <AboutPage />}
      </div>
    </>
  );
}

export default App;
