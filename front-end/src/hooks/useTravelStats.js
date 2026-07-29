import { useEffect, useState } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';

// Shared by Dashboard.jsx and Overview.jsx, which both need the same
// /api/travels categorization (total/ongoing/upcoming/completed counts).
export default function useTravelStats() {
  const [stats, setStats] = useState({ total: 0, ongoing: 0, upcoming: 0, completed: 0 });
  const baseURL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    let cancelled = false;

    axios.get(`${baseURL}/api/travels`)
      .then((res) => {
        if (cancelled) return;
        const travels = res.data;
        const today = dayjs();
        let upcoming = 0;
        let completed = 0;
        let ongoing = 0;

        travels.forEach((travel) => {
          const dateFrom = dayjs(travel.DatesFrom);
          const dateTo = dayjs(travel.DatesTo);

          if (dateFrom.isAfter(today, 'day')) {
            upcoming += 1;
          } else if (dateTo.isBefore(today, 'day')) {
            completed += 1;
          } else {
            ongoing += 1;
          }
        });

        setStats({ total: travels.length, ongoing, upcoming, completed });
      })
      .catch((err) => {
        console.error('Failed to fetch travels:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [baseURL]);

  return stats;
}
