import { useEffect, useRef, useState } from 'react';

import './App.css';

function App() {
  const [message, setMessage] = useState('');
  const [flights, setFlights] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const workerRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Initialize worker for data processing
    workerRef.current = new Worker(
      new URL('./workers/dataProcessor.worker.js', import.meta.url),
      { type: 'module'},
    );

    // Listen for processed data from worker
    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'DATA_PROCESSED') {
        setFlights(event.data.telemetry);
      }
    };

    // WebSocket logic wrapper
    const connectWebSocket = () => {
      setMessage('Connecting to FastApi Websocket server...');
      console.log('Connecting to FastApi Websocket server...');
      // Open Websocker connection to BE
      const ws = new WebSocket('ws://localhost:8000/ws');
      wsRef.current = ws;

      ws.onopen = () => {
        setMessage('Successful connection to FastApi Websocket server!');
        console.log('Successful connection to FastApi Websocket server!');
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
        setMessage('WebSocket closed. Reconnecting in 5 seconds...');
        console.log('WebSocket closed. Reconnecting in 5 seconds...');
        setIsConnected(false);
        // Retry connection after 5 seconds to allow server to reboot
        setTimeout(() => {
          connectWebSocket();
        }, 5000);
      };

      ws.onerror = () => {
        // Suppress any noisy errors while server is booting up
        setMessage('Waiting for server...');
        console.log('Waiting for server...');
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

  if (isConnected) {
    console.log(flights)
  }

  return (
    <>
      <section id="center">
        <div>
          <h1>Hello, world!</h1>
          <h2>{message}</h2>
        </div>
      </section>
    </>
  )
}

export default App
