import { useEffect, useRef, useState } from "react";

export default function PerfMonitor() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(0);

  useEffect(() => {
    let animationFrameId;
    frameCountRef.current = 0;
    // Set the initial non-idempotent time safely outside of the render thread
    lastTimeRef.current = performance.now();

    // Reset counters when switching tabs so idle time doesn't skew the reading
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTimeRef.current = performance.now();
        frameCountRef.current = 0;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const loop = () => {
      frameCountRef.current += 1;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      // Update the frame calculations exactly once per second
      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Determine health color threshold indicators
  const getStatusColor = (currentFps) => {
    if (currentFps >= 50) return "#10b981";
    if (currentFps >= 30) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="performance-monitor">
      <span style={{ color: getStatusColor(fps), fontWeight: "bold" }}>
        {fps} FPS
      </span>
    </div>
  );
}
