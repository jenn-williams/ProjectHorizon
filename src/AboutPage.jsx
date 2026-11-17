import "./AboutPage.css";
import ArchitectureDiagram from "./components/ArchitectureDiagram";

export default function AboutPage() {
  return (
    <div className="about-scroll-container">
      <article className="about-editorial-column">
        {/* Eyebrow & Hero Header */}
        <header className="about-hero">
          <span className="about-eyebrow">Architecture & Design Study</span>
          <h1 className="about-title">ProjectHorizon</h1>
          <p className="about-lead">
            An independent, real-time aviation telemetry studio designed to
            transform live global airspace data into a fluid, 60+ FPS
            interactive experience.
          </p>
        </header>

        <hr className="about-divider" />

        {/* System Architecture Section */}
        <section className="about-section">
          <h2>Overview</h2>
          <p>
            <strong>ProjectHorizon</strong> is an independent real-time flight
            tracker built to stream, process, and display thousands of live
            aircraft positions without dropping a frame.
          </p>
          <p>
            Most live data dashboards sacrifice visual smoothness when handling
            high-frequency updates, leading to laggy map dragging, frozen
            screens, and jarring error popups. <strong>ProjectHorizon</strong> pairs reliable
            backend engineering with thoughtful interface design—combining a
            background Web Worker pipeline and a rate-limit-safe FastAPI cache
            with smooth animations and self-healing error states.
          </p>
        </section>
        <section className="about-section">
          <h2>Architecture Deep-Dive</h2>
          <ol>
            <li>
              <strong>Keeping the UI Smooth with Background Web Workers</strong>
              <p>
                Processing thousands of raw flight records directly on React's
                main thread slows down browser rendering, causing noticeable
                stutter when dragging the map or scrolling through lists.
              </p>
              <ul>
                <li>
                  <strong>Background Data Pipeline:</strong> Incoming WebSocket
                  messages are sent straight to a dedicated Web Worker
                  (dataProcessor.worker.js). The worker parses the raw arrays,
                  formats coordinates and headings, updates a fast lookup cache,
                  and passes clean data back to the UI thread.
                </li>
                <li>
                  <strong>Virtualized Lists & Isolated Map Markers:</strong> By
                  pairing @tanstack/react-virtual for the flight directory with
                  CSS-isolated map markers (contain: layout style), the main
                  thread stays free for rendering—maintaining 60+ FPS even with
                  5,000+ live flights on screen.
                </li>
              </ul>
            </li>
            <li>
              <strong>Rate-Limit-Safe Backend & Live Streaming</strong>
              <p>
                Public aviation APIs like the OpenSky Network enforce strict
                daily request limits (429 Too Many Requests), while global
                flight queries return large payloads.
              </p>
              <ul>
                <li>
                  <strong>Shared Server Cache:</strong> Built with Python and
                  FastAPI, the backend uses an async lock (asyncio.Lock) and
                  timestamp checks so concurrent user connections share a single
                  cached response. No matter how many people open the app at
                  once, the server queries the OpenSky API at most once per
                  polling window.
                </li>
                <li>
                  <strong>Fast WebSocket Broadcasting:</strong> Fresh flight
                  batches and structured error messages are pushed to connected
                  browsers in under 100ms through a WebSocket manager that
                  safely handles unexpected client disconnects mid-broadcast.
                </li>
              </ul>
            </li>
            <li>
              <strong>Smooth Transitions & Spatial Context</strong>
              <p>
                Every animation in <strong>ProjectHorizon</strong> is designed to help users keep
                their bearings rather than snapping abruptly between views.
              </p>
              <ul>
                <li>
                  <strong>Synchronized Plane Loader:</strong> Instead of a
                  generic loading spinner, an aircraft orbits an SVG path while
                  the initial data loads. Once the stream connects, the plane
                  finishes its current loop, accelerates smoothly toward the
                  top-right corner, and cross-fades into the live map.
                </li>
                <li>
                  <strong>Smooth Search Camera:</strong> Searching for a flight
                  calculates a bounding box (fitBounds) to frame matching
                  aircraft on the map, while clearing the search bar glides the
                  camera back out along a smooth flyTo arc—avoiding disorienting
                  instant jumps.
                </li>
              </ul>
            </li>
            <li>
              <strong>Graceful, Self-Healing Error Handling</strong>
              <p>
                Live data feeds inevitably hit rate limits, server timeouts, and
                dropped connections. Instead of crashing the screen or wiping
                existing planes off the map when an error happens,
                <strong> ProjectHorizon</strong> adapts based on whether cached data is already
                available:
              </p>
              <ul>
                <li>
                  <strong>Non-Blocking Toast Alerts:</strong> If flights are
                  already visible on the map, temporary issues like API rate
                  limits (429) appear as subtle toast banners—keeping the map
                  fully interactive while showing the latest snapshot.
                </li>
                <li>
                  <strong>Frosted Glass Recovery Overlay:</strong> If an error
                  happens on initial load before any flights are cached, the
                  interface applies a frosted glass blur (backdrop-filter) with
                  a pulsing status indicator. The moment a 200 OK update
                  arrives, the blur dissolves automatically with zero layout
                  shift.
                </li>
              </ul>
            </li>
          </ol>
        </section>
        <section className="about-section">
          <h2>Architecture Diagram</h2>
          <ArchitectureDiagram />
        </section>

        {/* Open-Source Foundations & Citation */}
        <section className="about-section">
          <h2>Data & Open-Source Foundations</h2>
          <p>
            <strong>ProjectHorizon</strong> is built entirely on open-source ecosystems and
            public datasets. Live flight state vectors are sourced from the{" "}
            <a
              href="https://opensky-network.org"
              target="_blank"
              rel="noreferrer"
            >
              OpenSky Network
            </a>{" "}
            public API dataset. If utilizing this data for research or academic
            purposes, please cite the foundational paper:
          </p>

          <blockquote className="about-citation">
            Matthias Schäfer, Martin Strohmeier, Vincent Lenders, Ivan
            Martinovic, and Matthias Wilhelm. "Bringing Up OpenSky: A
            Large-scale ADS-B Sensor Network for Research." In Proceedings of
            the 13th International Symposium on Information Processing in Sensor
            Networks (IPSN), April 2014.
          </blockquote>

          <p>
            Interactive map layers and geographic visualizations are rendered
            via MapLibre GL using vector tile styles provided by{" "}
            <a href="https://openfreemap.org" target="_blank" rel="noreferrer">
              OpenFreeMap
            </a>
            , with map design by © OpenMapTiles and foundational spatial data
            sourced from the © OpenStreetMap contributors.
          </p>
        </section>

        {/* Creator Note Callout */}
        <aside className="about-card">
          <p>
            An independent creative engineering study by{" "}
            <strong>Jennifer Williams</strong> exploring the intersection of
            real-time telemetry, WebGL rendering, and resilient UI design.
          </p>
        </aside>

        {/* Legal Footer */}
        <footer className="about-footer">
          <p>
            © 2026 Jennifer Williams. All rights reserved. This repository is
            published publicly for portfolio and evaluation purposes.
            Unauthorized copying, modification, or redistribution of this source
            code is prohibited.
          </p>
        </footer>
      </article>
    </div>
  );
}
