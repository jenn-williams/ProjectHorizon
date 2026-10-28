// frontend/src/utils/conversions.js

/**
 * Convert from meters to feet
 */
export const metersToFeet = (meters) => {
  if (meters !== null && meters !== undefined) {
    const metersRaw = meters * 3.28084;
    return Math.round(metersRaw || 0);
  }
  return 0;
};

// Convert from meters/s to miles/hr
export const metersPerSecToMph = (meters) => {
  if (meters !== null && meters !== undefined) {
    const milesRaw = meters * 2.23694;
    return Math.round(milesRaw || 0);
  }
  return 0;
};
