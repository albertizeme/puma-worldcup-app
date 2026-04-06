"use client";

import { useEffect } from "react";

const STORAGE_KEY = "puma_worldcup_last_seen_ping";
const THROTTLE_MS = 15 * 60 * 1000; // 15 min

export default function AuthActivityTracker() {
  useEffect(() => {
    const now = Date.now();
    const lastPing = Number(window.localStorage.getItem(STORAGE_KEY) || "0");

    if (now - lastPing < THROTTLE_MS) {
      return;
    }

    const controller = new AbortController();

    fetch("/api/account/track-seen", {
      method: "POST",
      keepalive: true,
      signal: controller.signal,
    })
      .then((response) => {
        if (response.ok) {
          window.localStorage.setItem(STORAGE_KEY, String(now));
        }
      })
      .catch(() => {
        // Silencioso: no queremos romper UX por un ping fallido
      });

    return () => {
      controller.abort();
    };
  }, []);

  return null;
}