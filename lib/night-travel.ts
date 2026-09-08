/**
 * Night Travel Utility Functions
 * Recyc Works operational window for Night Travel is 18:30 to 06:00 local time.
 */

export function isNightTime(date: Date = new Date()): boolean {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  // 18:30 is 18 * 60 + 30 = 1110 minutes
  // 06:00 is 6 * 60 = 360 minutes
  return totalMinutes >= 1110 || totalMinutes < 360;
}

export function isNightTravel(startDate: Date, endDate: Date = new Date()): boolean {
  if (isNightTime(startDate) || isNightTime(endDate)) return true;
  // If the trip lasted >= 12 hours, it crossed the night window
  const durationMs = Math.abs(endDate.getTime() - startDate.getTime());
  if (durationMs >= 12 * 60 * 60 * 1000) return true;
  return false;
}
