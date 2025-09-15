import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// ---- Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function RecenterOnPosition({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, zoom, { animate: true });
  }, [map, position, zoom]);
  return null;
}

export default function LiveLocationPage() {
  const [coords, setCoords] = useState(null); 
  const [status, setStatus] = useState("Requesting precise location…");
  const [error, setError] = useState("");
  const [follow, setFollow] = useState(true);
  const [lastAt, setLastAt] = useState(null);
  const watchIdRef = useRef(null);

  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation is not supported by your browser.");
      setStatus("");
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.protocol !== "https:" &&
      window.location.hostname !== "localhost"
    ) {
      setStatus("Tip: For best accuracy, serve this page over HTTPS.");
    }

    const options = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading } = pos.coords;
        setCoords({ lat: latitude, lng: longitude, accuracy, speed, heading });
        setLastAt(new Date());
        setError("");
        setStatus(accuracy ? `Accuracy: ~${Math.round(accuracy)} m` : "");
      },
      (err) => {
        let msg = "";
        if (err.code === err.PERMISSION_DENIED)
          msg = "Location permission denied.";
        else if (err.code === err.POSITION_UNAVAILABLE)
          msg = "Location unavailable.";
        else if (err.code === err.TIMEOUT)
          msg = "Timed out.";
        else msg = err.message || "Unknown error";
        setError(msg);
        setStatus("");
      },
      options
    );

    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  // function to open in Google Maps
  const openInGoogleMaps = () => {
    if (!coords) return;
    const lat = coords.lat.toFixed(6);
    const lng = coords.lng.toFixed(6);
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const accuracyBadge = () => {
    if (!coords?.accuracy) return null;
    const a = coords.accuracy;
    let label = "Low";
    if (a <= 30) label = "High";
    else if (a <= 100) label = "Medium";
    return (
      <span
        className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
          label === "High"
            ? "bg-green-100 text-green-700"
            : label === "Medium"
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600">TourShield</h1>
        <div className="flex gap-6 text-gray-700 font-medium">
          <a href="/" className="hover:text-blue-600">Home</a>
          <a href="/get-started" className="hover:text-blue-600">Get Started</a>
          <a href="/signup" className="hover:text-blue-600">Sign Up</a>
          <a href="/live-location" className="text-blue-600 font-semibold">Live Location</a>
        </div>
      </nav>

      {/* Header */}
      <section className={`text-center px-6 pt-8 transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
        }`}>
        <h2 className="text-3xl font-bold text-blue-600 mb-2">Your Live Location</h2>
        {status && <p className="text-sm text-gray-600">{status}{accuracyBadge()}</p>}
        {lastAt && <p className="text-xs text-gray-500 mt-1">Last update: {lastAt.toLocaleTimeString()}</p>}
        {error && <div className="mt-3 inline-block rounded-lg bg-red-50 text-red-700 px-3 py-2">{error}</div>}

        {coords && (
          <div className="mt-4 inline-flex items-center gap-4 bg-white rounded-xl shadow px-4 py-2">
            <div>
              <span className="text-gray-500 text-sm">Latitude</span>
              <div className="font-semibold">{coords.lat.toFixed(6)}</div>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Longitude</span>
              <div className="font-semibold">{coords.lng.toFixed(6)}</div>
            </div>
            <button
              onClick={openInGoogleMaps}
              className="px-3 py-1 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Open in Google Maps
            </button>
          </div>
        )}
      </section>

      {/* Map */}
      <section className="flex-grow px-6 pb-10">
        {coords ? (
          <div className={`rounded-2xl overflow-hidden shadow-lg transition-all duration-700 ${
              visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.99]"
            }`}>
            <MapContainer
              center={[coords.lat, coords.lng]}
              zoom={16}
              style={{ height: "70vh", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              />
              {follow && <RecenterOnPosition position={[coords.lat, coords.lng]} zoom={16} />}
              <Marker position={[coords.lat, coords.lng]}>
                <Popup>You are here 📍</Popup>
              </Marker>
              {coords.accuracy && (
                <Circle center={[coords.lat, coords.lng]} radius={Math.min(coords.accuracy, 200)} />
              )}
            </MapContainer>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 bg-gray-200 rounded-2xl animate-pulse">
            <p className="text-gray-600">Locating you…</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-300 text-center">
        <p>© {new Date().getFullYear()} TourShield. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
