// Web Worker for handling object parsing and formatting outside main thread

self.onmessage = (event) => {
    const { type, rawData } = event.data || {};

    if (type === 'PROCESS_TELEMETRY') {
        // Map OpenSky arrays to UI object
        const formattedData = (rawData || {}).map((flight) => ({
            icao24: flight[0], // Unique ICAO 24-bit address of the transponder in hex string representation.
            callsign: flight[1] ? flight[1].trim() : 'UNKNOWN', // Callsign of the vehicle (8 chars). Can be null if no callsign has been received.
            country: flight[2] || 'UNKNOWN', // Country name inferred from the ICAO 24-bit address.
            longitude: flight[5], // WGS-84 longitude in decimal degrees. Can be null.
            latitude: flight[6], // WGS-84 latitude in decimal degrees. Can be null.
            altitude: flight[7] || null, // Barometric altitude in meters. Can be null.
            velocity: flight[9] || null, // Velocity over ground in m/s. Can be null.
            heading: flight[10] || null, // True track in decimal degrees clockwise from north (north=0°). Can be null.
            category: flight[17] || 'UNKNOWN', // Aircraft category, integer 0 - 20
        })).filter((f) => f.icao24 && f.longitude && f.latitude); // Make sure that only flights with valid coordinates and ICAO are included.
        // Send formatted data back to main thread
        self.postMessage({ type: 'DATA_PROCESSED', telemetry: formattedData });
    }
};
