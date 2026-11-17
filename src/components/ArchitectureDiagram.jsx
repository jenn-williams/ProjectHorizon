import "./ArchitectureDiagram.css";

export default function ArchitectureDiagram() {
  return (
    <figure className="arch-diagram-wrapper">
      <svg
        viewBox="0 0 920 440"
        className="arch-svg"
        role="img"
        aria-label="ProjectHorizon System Architecture Diagram showing OpenSky API, FastAPI Cache, WebSocket Stream, Off-Thread Web Worker, and 60 FPS UI Layer"
      >
        <defs>
          {/* Subtle glowing dot pattern for the canvas background */}
          <pattern id="dotGrid" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="rgba(255, 255, 255, 0.06)" />
          </pattern>

          {/* Cyan gradient for active data flow pulses */}
          <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.9" />
          </linearGradient>

          {/* Arrowhead markers */}
          <marker
            id="arrowCyan"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>

          <marker
            id="arrowMuted"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>
        </defs>

        {/* Background Grid */}
        <rect width="920" height="440" rx="14" fill="#0d1015" />
        <rect width="920" height="440" rx="14" fill="url(#dotGrid)" />
        <rect
          x="0.5"
          y="0.5"
          width="919"
          height="439"
          rx="14"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
        />

        {/* ===================================================================
            COLUMN 1: UPSTREAM DATA SOURCE
           =================================================================== */}
        <g transform="translate(32, 165)">
          <rect
            width="175"
            height="110"
            rx="10"
            fill="#141821"
            stroke="rgba(255,255,255,0.1)"
          />
          <text x="16" y="28" className="node-eyebrow">
            EXTERNAL API
          </text>
          <text x="16" y="54" className="node-title">
            OpenSky Network
          </text>
          <text x="16" y="76" className="node-sub">
            Global ADS-B state
          </text>
          <text x="16" y="93" className="node-sub">
            vectors (REST / JSON)
          </text>
        </g>

        {/* ===================================================================
            COLUMN 2: FASTAPI BACKEND CONTAINER
           =================================================================== */}
        <g transform="translate(265, 45)">
          {/* Outer Group Box */}
          <rect
            width="245"
            height="350"
            rx="12"
            fill="rgba(20, 24, 33, 0.7)"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeDasharray="4 4"
          />
          <text x="18" y="28" className="group-label">
            PYTHON · FASTAPI SERVER
          </text>

          {/* Sub-node 1: Cache */}
          <g transform="translate(18, 48)">
            <rect
              width="209"
              height="80"
              rx="8"
              fill="#161b26"
              stroke="rgba(255,255,255,0.1)"
            />
            <text x="14" y="26" className="node-title">
              Rate-Limit Cache
            </text>
            <text x="14" y="47" className="node-sub">
              Locks concurrent requests,
            </text>
            <text x="14" y="64" className="node-sub">
              prevents duplicate API calls
            </text>
          </g>

          {/* Sub-node 2: Error Mapper */}
          <g transform="translate(18, 148)">
            <rect
              width="209"
              height="74"
              rx="8"
              fill="#161b26"
              stroke="rgba(255,255,255,0.1)"
            />
            <text x="14" y="26" className="node-title">
              API Error Handler
            </text>
            <text x="14" y="47" className="node-sub">
              Maps 429 / 5xx codes into
            </text>
            <text x="14" y="63" className="node-sub">
              into UI-ready status alerts
            </text>
          </g>

          {/* Sub-node 3: Connection Manager */}
          <g transform="translate(18, 242)">
            <rect
              width="209"
              height="86"
              rx="8"
              fill="#161b26"
              stroke="rgba(56, 189, 248, 0.35)"
            />
            <text x="14" y="26" className="node-title">
              WebSocket Broadcaster
            </text>
            <text x="14" y="47" className="node-sub">
              Streams live flight updates
            </text>
            <text x="14" y="64" className="node-sub">
              to all clients in &lt;100ms
            </text>
          </g>

          {/* Internal vertical connectors */}
          <line x1="122" y1="128" x2="122" y2="146" stroke="#475569" strokeWidth="1.5" />
          <line x1="122" y1="222" x2="122" y2="240" stroke="#475569" strokeWidth="1.5" />
        </g>

        {/* ===================================================================
            COLUMN 3: BROWSER CLIENT
           =================================================================== */}
        <g transform="translate(575, 45)">
          {/* Outer Browser Box */}
          <rect
            width="312"
            height="350"
            rx="12"
            fill="rgba(20, 24, 33, 0.7)"
            stroke="rgba(129, 140, 248, 0.25)"
          />
          <text x="18" y="28" className="group-label">
            REACT BROWSER CLIENT
          </text>

          {/* Off-Thread Web Worker Node */}
          <g transform="translate(18, 48)">
            <rect
              width="276"
              height="96"
              rx="8"
              fill="#161b26"
              stroke="rgba(56, 189, 248, 0.45)"
            />
            <rect x="182" y="12" width="80" height="20" rx="4" fill="rgba(56, 189, 248, 0.14)" />
            <text x="222" y="25" textAnchor="middle" className="badge-cyan">
              OFF-THREAD
            </text>

            <text x="14" y="27" className="node-title">
              Background Web Worker
            </text>
            <text x="14" y="50" className="node-sub">
              • Processes 5,000+ live flights
            </text>
            <text x="14" y="67" className="node-sub">
              • Formats data &amp; creates search cache
            </text>
            <text x="14" y="84" className="node-sub">
              • Keeps UI thread free from lag
            </text>
          </g>

          {/* Thread Boundary Divider */}
          <line
            x1="18"
            y1="162"
            x2="294"
            y2="162"
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="3 3"
          />

          {/* Internal Worker -> Main Thread Flow */}
          <path
            d="M 156 144 L 156 182"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            markerEnd="url(#arrowCyan)"
            className="flow-line-fast"
          />
          <g transform="translate(52, 155)">
            <rect
              width="208"
              height="12"
              rx="4"
              fill="#11151d"
              stroke="rgba(255, 255, 255, 0.1)"
            />
            <text x="104" y="9" textAnchor="middle" className="boundary-tag">
              PARSED DATA SENT ASYNCHRONOUSLY
            </text>
          </g>

          {/* Main UI Thread Node */}
          <g transform="translate(18, 186)">
            <rect
              width="276"
              height="142"
              rx="8"
              fill="#161b26"
              stroke="rgba(129, 140, 248, 0.4)"
            />
            <rect x="190" y="12" width="72" height="20" rx="4" fill="rgba(129, 140, 248, 0.16)" />
            <text x="226" y="25" textAnchor="middle" className="badge-indigo">
              60+ FPS
            </text>

            <text x="14" y="27" className="node-title">
              Interactive Map &amp; UI
            </text>
            <text x="14" y="52" className="node-sub">
              • MapLibre GL WebGL canvas
            </text>
            <text x="14" y="70" className="node-sub">
              • TanStack virtualized list
            </text>
            <text x="14" y="88" className="node-sub">
              • Smooth SVG loading animation
            </text>
            <text x="14" y="106" className="node-sub">
              • Self-healing toast / blur alert
            </text>
            <text x="14" y="124" className="node-sub">
              • Smooth zoom-to-search camera
            </text>
          </g>

          
        </g>

        {/* ===================================================================
            INTER-COLUMN ANIMATED STREAMING CONNECTORS
           =================================================================== */}

        {/* Polling */}
        <path
          d="M 207 220 L 260 220"
          fill="none"
          stroke="#475569"
          strokeWidth="1.75"
        />
        <path
          d="M 207 220 L 260 220"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2"
          markerEnd="url(#arrowCyan)"
          className="flow-line-slow"
        />
        <text x="234" y="208" textAnchor="middle" className="edge-label">
          10s Poll
        </text>

        {/* WS stream */}
        <path
          d="M 492 330 C 535 330, 530 140, 588 140"
          fill="none"
          stroke="rgba(56, 189, 248, 0.2)"
          strokeWidth="2"
        />
        <path
          d="M 492 330 C 535 330, 530 140, 588 140"
          fill="none"
          stroke="url(#pulseGradient)"
          strokeWidth="2.5"
          markerEnd="url(#arrowCyan)"
          className="flow-line-fast"
        />
        <rect x="505" y="222" width="68" height="20" rx="4" fill="#0d1015" />
        <text x="540" y="236" textAnchor="middle" className="edge-label-highlight">
          WS Stream
        </text>

        {/* Error handling */}
        <path
          d="M 492 348 L 588 348"
          fill="none"
          stroke="#64748b"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          markerEnd="url(#arrowMuted)"
        />
        <text x="540" y="365" textAnchor="middle" className="edge-label">
          Error JSON
        </text>
      </svg>

      <figcaption className="arch-caption">
        End-to-end architecture that separates API caching and background data parsing from the UI thread to keep the interactive map running smoothly at 60+ FPS.
      </figcaption>
    </figure>
  );
}
