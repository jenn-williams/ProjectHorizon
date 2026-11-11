import './AboutPage.css';

export default function AboutPage() {
  return (
    <div className="about-scroll-container">
      <article className="about-editorial-column">
        {/* Eyebrow & Hero Header */}
        <header className="about-hero">
          <span className="about-eyebrow">Architecture & Design Study</span>
          <h1 className="about-title">ProjectHorizon</h1>
          <p className="about-lead">
            An independent, real-time aviation telemetry studio designed to transform 
            live global airspace data into a fluid, 60+ FPS interactive experience.
          </p>
        </header>

        <hr className="about-divider" />

        {/* System Architecture Section */}
        <section className="about-section">
          <h2>System Architecture</h2>
          <p>
            Built on a decoupled architecture, the React and MapLibre GL frontend 
            offloads heavy JSON parsing and spatial caching to dedicated client-side 
            Web Workers. Keeping the main thread completely free allows thousands of 
            concurrent aircraft vectors to render without dropping a frame.
          </p>
          <p>
            On the backend, a high-concurrency FastAPI server manages an automated, 
            timestamp-driven lifecycle cache that protects API rate limits while 
            streaming updates over persistent WebSockets in under 100ms.
          </p>
        </section>

        {/* Open-Source Foundations & Citation */}
        <section className="about-section">
          <h2>Data & Open-Source Foundations</h2>
          <p>
            ProjectHorizon is built entirely on open-source ecosystems and public datasets. 
            Live flight state vectors are sourced from the{' '}
            <a href="https://opensky-network.org" target="_blank" rel="noreferrer">
              OpenSky Network
            </a>{' '}
            public API dataset. If utilizing this data for research or academic purposes, 
            please cite the foundational paper:
          </p>

          <blockquote className="about-citation">
            Matthias Schäfer, Martin Strohmeier, Vincent Lenders, Ivan Martinovic, and 
            Matthias Wilhelm. "Bringing Up OpenSky: A Large-scale ADS-B Sensor Network 
            for Research." In Proceedings of the 13th International Symposium on Information 
            Processing in Sensor Networks (IPSN), April 2014.
          </blockquote>

          <p>
            Interactive map layers and geographic visualizations are rendered via MapLibre GL 
            using vector tile styles provided by{' '}
            <a href="https://openfreemap.org" target="_blank" rel="noreferrer">
              OpenFreeMap
            </a>
            , with map design by © OpenMapTiles and foundational spatial data sourced from 
            the © OpenStreetMap contributors.
          </p>
        </section>

        {/* Creator Note Callout */}
        <aside className="about-card">
          <p>
            An independent creative engineering study by <strong>Jennifer Williams</strong> exploring the intersection
            of real-time telemetry, WebGL rendering, and resilient UI design.
          </p>
        </aside>

        {/* Legal Footer */}
        <footer className="about-footer">
          <p>
            © 2026 Jennifer Williams. All rights reserved. This repository is published 
            publicly for portfolio and evaluation purposes. Unauthorized copying, 
            modification, or redistribution of this source code is prohibited.
          </p>
        </footer>
      </article>
    </div>
  );
}
