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

function PlaneLoader({ isReady, onBreakoutStart, onTransitionComplete }) {
  const [backdropFade, setBackdropFade] = useState(false);
  const [exitTriggered, setExitTriggered] = useState(false);

  const handleAnimationIteration = () => {
    // If the app is ready, catch the loop reset and switch to the exit sequence
    if (isReady && !exitTriggered) {
      setExitTriggered(true);
    }
  };

  useEffect(() => {
    if (exitTriggered) {
      // 1. At 850ms, the plane breaks out.
      // Trigger the dashboard fade-IN and the loader background fade-OUT at the exact same frame!
      const transitionStartTimer = setTimeout(() => {
        onBreakoutStart();
        setBackdropFade(true); // Start dissolving the dark background curtain right now
      }, 850);

      // 2. Give the plane plenty of time to finish its slow, beautiful 5.5s diagonal glide
      // before unmounting the element completely from the layout tree.
      const unmountTimer = setTimeout(() => {
        onTransitionComplete();
      }, 5500);

      return () => {
        clearTimeout(transitionStartTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [exitTriggered, onBreakoutStart, onTransitionComplete]);

  return (
    <div className={`loader-backdrop ${backdropFade ? "fade-out" : ""}`}>
      <div className="flight-universe">
        <div className="flight-zone">
          <div>
            <div className={`flight-container`}>
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
                  className={"flight-path"}
                  d="M 150,165 a 130,65 0 1,0 0.1,0 Z"
                />
                <g
                  className={`breakout-wrapper ${exitTriggered ? "run-exit" : ""}`}
                >
                  <g
                    className={`airplane ${exitTriggered ? "breakout" : ""}`}
                    onAnimationIteration={handleAnimationIteration}
                  >
                    <image
                      href="./plane.svg"
                      width="150"
                      height="150"
                      x="-75"
                      y="-75"
                    />
                  </g>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const ERROR_SEVERITY_MAP = {
  // Minor/Transient Errors -> Trigger Toast Notice

  // Hit daily credit limit
  "RATE_LIMITED": { severity: "TRANSIENT", title: "Rate Limit Exceeded", isBlocking: false },
  // Error with API request params
  "INVALID_CONSTRAINTS": { severity: "TRANSIENT", title: "API Validation Error", isBlocking: false },
  // Data cannot be read (pipeline cannot be processed due to payload alteration or parsing error)
  "UNKNOWN_DEGRADATION": { severity: "TRANSIENT", title: "Pipeline/Decoder Anomaly", isBlocking: false },
  
  // Severe/Blocking Errors -> Trigger Glassmorphic Blur Modal

  // Expired token/invalid credentials
  "AUTH_DENIED": { severity: "BLOCKING", title: "Access Key Revoked", isBlocking: true },
  // Error from OpenSky
  "DOWNSTREAM_CRASH": { severity: "BLOCKING", title: "OpenSky Network Error", isBlocking: true },
  // No connection to API
  "NETWORK_FAULT": { severity: "BLOCKING", title: "Network Interrupted", isBlocking: true },
  // WebSocket closes unexpectedly (network connection/reboot)
  "CONNECTION_LOST": { severity: "BLOCKING", title: "WebSocket Disconnected", isBlocking: true },
  // Unexpected server code error
  "INTERNAL_SYSTEM_FAULT": { severity: "BLOCKING", title: "Internal Server Error", isBlocking: true },
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
      if (event.data.type === "WORKER_ERROR") {
        const error_config = ERROR_SEVERITY_MAP.UNKNOWN_DEGRADATION;
        setActiveError({
            ...error_config,
            message: event.data.message,
          });
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
            const errorConfig = ERROR_SEVERITY_MAP[payload.error] || {
              severity: "TRANSIENT",
              title: "System Exception",
              isBlocking: false
            };
            setActiveError({
              ...errorConfig,
              message: payload.message,
            });
          }
        } catch {
          const error_config = ERROR_SEVERITY_MAP.UNKNOWN_DEGRADATION;
          setActiveError({
            ...error_config,
            message: "Failed to process downstream data packets.",
          });
        }
      };

      ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting in 5 seconds...");
        const closedConfig = ERROR_SEVERITY_MAP["CONNECTION_LOST"];
        setActiveError({
          ...closedConfig,
          message: "Data stream disconnected. Re-establishing link in 5 seconds...",
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

  const flightCount = searchQuery
    ? `${filteredFlights.length} of ${flights.length}`
    : `${flights.length}`;

  // only show plane animation on inital load, if WebSocket disconnects later handle error gracefully with blur modal
  const isDataLoaded = (isConnected && flights.length > 0) || (!isConnected && activeError?.title);

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
        {activeError && !activeError?.isBlocking && (
          <div className="error-toast-layer">
            <div className="pulse-beacon" />
            <div className="error-toast-content">
              <span className="error-toast-title">{activeError.title}:</span>
              <span className="error-toast-message">{activeError.message}</span>
            </div>
            <button
              className="error-toast-dismiss"
              onClick={() => setActiveError(null)}
            >
              ×
            </button>
          </div>
        )}
        <div
          className={`content-wrapper ${isTakingOff ? "dashboard-reveal" : "dashboard-hidden"} ${activeError?.isBlocking ? "stale-state" : ""}`}
        >
          <div className="content-left">
            <FlightList flights={filteredFlights} />
          </div>
          <div className="content-right">
            <FlightMap
              flights={filteredFlights}
              flightsCache={flightsCacheRef}
            />
          </div>
          {activeError?.isBlocking && (
          <div className="glass-recovery-modal">
            <div className="pulse-beacon" />
            <h3 className="modal-title">{activeError.title}</h3>
            <p className="modal-message">{activeError.message}</p>
          </div>
        )}
        </div>
        {!isAnimationComplete && (
          <PlaneLoader
            isReady={isDataLoaded}
            onBreakoutStart={() => setIsTakingOff(true)}
            onTransitionComplete={() => setIsAnimationComplete(true)}
          />
        )}
      </div>
    </>
  );
}

export default App;
