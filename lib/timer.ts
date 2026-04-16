/**
 * Utility to get or create a synchronized promotion end time.
 * This ensures all pages show the same countdown.
 */
export const getPromoTarget = (): number => {
  if (typeof window === "undefined") return Date.now() + 24 * 60 * 60 * 1000;

  const STORE_KEY = "promo_end_time";
  const stored = localStorage.getItem(STORE_KEY);
  const now = Date.now();

  if (stored) {
    const target = parseInt(stored, 10);
    // If if hasn't expired, use it
    if (target > now) {
      return target;
    }
  }

  // Create a new target: 24 hours from now
  const newTarget = now + 24 * 60 * 60 * 1000;
  localStorage.setItem(STORE_KEY, newTarget.toString());
  return newTarget;
};

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const calculateTimeLeft = (targetTime: number): TimeLeft => {
  const difference = targetTime - Date.now();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};
