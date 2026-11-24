import { useEffect, useState } from 'react';

/** Current time, refreshed every minute, for countdowns like "Resets in 5h 12m". */
export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
