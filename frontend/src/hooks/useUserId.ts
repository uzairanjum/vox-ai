import { useEffect, useState } from "react";

export function useUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // 1. try cache first
    const cached = localStorage.getItem("uid");

    if (cached) {
      setUserId(cached);
      return;
    }

    // 2. fetch from our mini endpoint
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          localStorage.setItem("uid", data.id);
          setUserId(data.id);
        }
      })
      .catch(() => {
        /* ignore */
      });
  }, []);

  return userId;
}
