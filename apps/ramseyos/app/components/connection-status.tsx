"use client";

import { useEffect, useState } from "react";

export function ConnectionStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "reconnected">("online");

  useEffect(() => {
    const handleOnline = () => {
      setStatus("reconnected");
      setTimeout(() => setStatus("online"), 3000);
    };
    const handleOffline = () => setStatus("offline");

    // Check initial state
    if (!navigator.onLine) setStatus("offline");

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (status === "online") return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[60] text-center text-[11px] py-1.5 transition-colors ${
        status === "offline"
          ? "bg-amber-500/90 text-black"
          : "bg-emerald-500/90 text-white"
      }`}
    >
      {status === "offline"
        ? "You're offline — some features may be limited"
        : "Back online"}
    </div>
  );
}
