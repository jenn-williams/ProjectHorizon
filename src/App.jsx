import { useEffect, useRef, useState } from "react";
import FlightList from "./components/FlightList";
import LiveMapTest from "./components/LiveMapTest";

import "./App.css";

function App() {
  const [flights, setFlights] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const workerRef = useRef(null);
  const wsRef = useRef(null);

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

  return (
    <>
      
      <div
        style={{
          boxSizing: "border-box",
          display: "flex",
          height: "100vh",
          maxHeight: "100vh",
          overflow: "hidden",
          position: "relative",
          width: "100vw",
        }}
      >
        {flights && isConnected && flights.length > 0 ? (
          <>
            <div
              style={{
                borderRight: "1px solid #ccc",
                boxSizing: "border-box",
                height: "100%",
                width: "30%",
              }}
            >
              <h3 style={{ margin: '5px 0 12px 5px', fontFamily: 'sans-serif' }}>Live Aircraft Ingestion ({flights.length})</h3>
              <FlightList flights={flights} />
            </div>
            <div
              style={{
                boxSizing: "border-box",
                height: "100%",
                position: "relative",
                width: "70%",
              }}
            >
              {/* <FlightMap flights={flights} /> */}
            </div>
          </>
        ) : (
          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              width: "100%",
            }}
          >
            Loading...
          </div>
        )}
      </div>
    </>
  );
}

export default App;
