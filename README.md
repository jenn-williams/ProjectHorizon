# ✈️ ProjectHorizon

A real-time global flight tracking dashboard built with **React**, **MapLibre GL**, and **FastAPI**. Designed to stream, process, and render thousands of live aircraft locations at **60+ FPS** while keeping the user interface fast and responsive.

* 🔗 **[Live Demo](https://jenn-williams.github.io/ProjectHorizon/)** *(Hosted on GitHub Pages + Fly.io)*

---

## 🏗️ System Architecture & Key Optimizations

Unlike basic polling dashboards that freeze the browser or exceed API rate limits, this application separates data processing from map rendering:

### 1. Background Data Processing (Web Workers)
* **Compact Data Streaming:** Receives raw flight data arrays directly from the OpenSky Network API over a persistent WebSocket connection to keep network payloads small.
* **Data Filtering:** Automatically removes incomplete flight records missing required coordinates (like latitude or longitude) or callsign/ICAO24 code before rendering to prevent map errors.
* **Smooth 60+ FPS Rendering:** Moves JSON parsing and data indexing into a background **Web Worker** (`dataProcessor.worker.js`). This keeps the main browser thread free for smooth map panning, custom marker rotations, and virtualized list scrolling (`@tanstack/react-virtual`).

### 2. Reliable WebSocket Management
* **Clean Connection Cleanup:** Clears `onclose` listeners during component unmount (`wsRef.current.onclose = null`) so React's development mode does not spawn duplicate reconnection loops.
* **Safe Broadcast Loops:** Iterates over a copy of the active client list (`self.active_connections[:]`) on the backend so disconnecting users never interrupt live data broadcasts to other active viewers.

### 3. Smart Timestamp Caching
* **On-Demand Data Fetching:** Uses a server-side cache driven by timestamp comparisons (`last_fetch_time`) instead of continuous background polling.
* **Rate-Limit & Resource Protection:** Avoids wasting API credits when no users are active on the site, while delivering cached flight data in under 100ms to new visitors.

---

## 🛠️ Tech Stack

**Frontend**
* **Framework:** React 19 + Vite 8
* **Mapping Engine:** MapLibre GL JS (Vector tiles via OpenFreeMap)
* **Performance:** Web Workers API, TanStack Virtual (`@tanstack/react-virtual`)
* **Hosting:** GitHub Pages

**Backend**
* **Framework:** FastAPI + Uvicorn (`uvloop` on Linux)
* **HTTP & Validation:** `httpx`, `requests`, Pydantic v2
* **Hosting:** Fly.io (Containerized Linux VM)

---

## 🌐 Deployment & Architecture Note

* **Frontend:** Hosted on **GitHub Pages** and connects to the live backend telemetry stream via secure WebSockets (`VITE_WS_URL`).
* **Backend:** The FastAPI server and caching layer are hosted privately on **Fly.io** to protect OpenSky API credentials and manage upstream rate limits.

---

## 📊 Data & Map Attributions

* **Live Flight Telemetry:** Sourced via the public API provided by the **OpenSky Network**.
* **Vector Map Styles:** Hosted and provided by **OpenFreeMap**.
* **Map Tile Design:** **© OpenMapTiles**.
* **Geographic Data:** **© OpenStreetMap contributors**.

---

## 📄 Copyright

© 2026 Jennifer Williams. All rights reserved.  
This repository is published publicly for portfolio and evaluation purposes. Unauthorized copying, modification, or redistribution of this source code is prohibited.
