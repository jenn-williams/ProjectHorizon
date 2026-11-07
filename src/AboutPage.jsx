export default function AboutPage() {
  return (
    <div style={{ margin: "20px" }}>
      <h1>About</h1>
      <div>
        <p>
          SkyTracker is an independent, high-performance flight tracking
          application built to stream and visualize live global aircraft
          telemetry in real time. Designed with a decoupled architecture, the
          platform features a responsive React frontend that offloads intensive
          data parsing to client-side Web Workers, ensuring a high FPS map
          experience (60+ FPS) even when rendering thousands of concurrent
          updates. The backend is powered by a high-concurrency FastAPI server
          optimized with an automated, timestamp-driven lifecycle cache that
          protects system resources while guaranteeing sub-100ms transmission
          times over an active, persistent WebSocket connection.
        </p>

        <p>
          This project is built entirely on open-source foundations and public
          data ecosystems. Live flight state vectors are sourced from the
          OpenSky Network's public API dataset. Flight data provided by the
          <a
            className="link"
            href="https://opensky-network.org"
            target="_blank"
          >
            OpenSky Network
          </a>
          . If utilizing this data for research or academic purposes, please
          cite the foundational paper:
        </p>

        <p>
          Matthias Schäfer, Martin Strohmeier, Vincent Lenders, Ivan Martinovic,
          and Matthias Wilhelm. "Bringing Up OpenSky: A Large-scale ADS-B Sensor
          Network for Research." In Proceedings of the 13th International
          Symposium on Information Processing in Sensor Networks (IPSN), April
          2014.
        </p>
      </div>
      <div>
        Interactive map layers and geographic visualizations are rendered via
        MapLibre GL using vector tile styles provided by
        <a className="link" href="https://openfreemap.org/" target="_blank">
          OpenFreeMap
        </a>
        , with map design by © OpenMapTiles and foundational spatial data
        sourced from the © OpenStreetMap contributors.
      </div>
    </div>
  );
}
