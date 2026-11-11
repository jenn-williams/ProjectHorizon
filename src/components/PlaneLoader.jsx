import { useEffect, useState } from "react";

export default function PlaneLoader({ isReady, onBreakoutStart, onTransitionComplete }) {
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
      }, 900);

      return () => {
        clearTimeout(transitionStartTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [exitTriggered, onBreakoutStart, onTransitionComplete]);

  return (
    <div className={`loader-backdrop ${backdropFade ? "fade-out" : ""}`}>
      <div className="flight-universe">
        <div className="loader-stage">
          <div
            className={`loader-title-group ${exitTriggered ? "title-fade-out" : ""}`}
          >
            <h1 className="loader-title">ProjectHorizon</h1>
            <span className="loader-subtitle">
              Connecting to live flights...
            </span>
          </div>
        </div>
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
