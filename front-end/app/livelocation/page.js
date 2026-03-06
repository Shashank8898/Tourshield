"use client";

import { useEffect } from "react";
import Script from "next/script";
import LiveLocationPage from "@/components/LiveLocation";

export default function LiveLocation() {
  useEffect(() => {
    // This runs once Script has loaded into the DOM
    const handleLoad = () => console.log("Google Maps API loaded");
    const handleError = () => console.error("Failed to load Google Maps API");

    // Wait for script tag
    const script = document.querySelector(
      `script[src*="maps.googleapis.com"]`
    );
    if (script) {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);
    }

    return () => {
      if (script) {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      }
    };
  }, []);

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="beforeInteractive"
      />
      <LiveLocationPage />
    </>
  );
}
