// Web Worker for handling object parsing and formatting outside main thread

self.onmessage = (event) => {
  const { type, rawData } = event.data || {};

  if (type === "PROCESS_TELEMETRY") {
    try {
      if (!rawData || !Array.isArray(rawData)) {
        throw new Error("Invalid or corrupted telemetry array received.");
      }
      // Create formatted array from OpenSky data
      const formattedData = (rawData || {})
        .map((flight) => ({
          icao24: flight[0], // Unique ICAO 24-bit address of the transponder in hex string representation.
          callsign: flight[1] ? flight[1].trim() : "UNKNOWN", // Callsign of the vehicle (8 chars). Can be null if no callsign has been received.
          longitude: flight[5], // WGS-84 longitude in decimal degrees. Can be null.
          latitude: flight[6], // WGS-84 latitude in decimal degrees. Can be null.
          altitude: flight[7] || null, // Barometric altitude in meters. Can be null.
          velocity: flight[9] || null, // Velocity over ground in m/s. Can be null.
          heading: flight[10] || null, // True track in decimal degrees clockwise from north (north=0°). Can be null.
          category: flight[17], // Aircraft category, integer 0 - 20 or undefined
        }))
        .filter((f) => f.icao24 && f.longitude && f.latitude); // Make sure that only flights with valid coordinates and ICAO are included.

      const dataCache = {}; // Create object using flight ID as key
      formattedData.forEach((flight) => {
        dataCache[flight.icao24] = flight;
      });

      // Send formatted raw data and data cache back to main thread
      self.postMessage({
        type: "DATA_PROCESSED",
        cache: dataCache,
        telemetry: formattedData,
      });
    } catch (error) {
      // Catch exceptions and send them safely to the UI
      self.postMessage({
        type: "WORKER_ERROR",
        error: "UNKNOWN_DEGRADATION",
        message: error.message || "Failed to process current flight data.",
      });
    }
  }
};
