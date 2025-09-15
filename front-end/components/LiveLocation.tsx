"use client";
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Clock, 
  Crosshair, 
  ExternalLink,
  RefreshCw,
  Zap,
  Satellite,
  Target,
  Activity,
  Globe,
  Lock,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom marker icon for better styling
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, #06b6d4, #3b82f6);
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 10px rgba(6, 182, 212, 0.5);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      </style>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

function RecenterOnPosition({ position, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView(position, zoom, { 
        animate: true,
        duration: 0.5
      });
    }
  }, [map, position, zoom]);
  return null;
}

export default function LiveLocationPage() {
  const [coords, setCoords] = useState(null); 
  const [status, setStatus] = useState("Initializing GPS tracking...");
  const [error, setError] = useState("");
  const [follow, setFollow] = useState(true);
  const [lastAt, setLastAt] = useState(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [locationHistory, setLocationHistory] = useState([]);
  const [mapStyle, setMapStyle] = useState('default');
  const watchIdRef = useRef(null);

  useEffect(() => setMounted(true), []);

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
      setStatus("⚠️ HTTPS recommended for best GPS accuracy");
    }

    startLocationTracking();

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        setTrackingActive(false);
      }
    };
  }, []);

  const startLocationTracking = () => {
    setTrackingActive(true);
    setStatus("🔍 Acquiring GPS signal...");

    const options = { 
      enableHighAccuracy: true, 
      maximumAge: 1000, 
      timeout: 10000 
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, speed, heading, timestamp } = pos.coords;
        const newLocation = { 
          lat: latitude, 
          lng: longitude, 
          accuracy, 
          speed: speed ? (speed * 3.6).toFixed(1) : null, // Convert to km/h
          heading,
          timestamp: new Date(timestamp || Date.now())
        };
        
        setCoords(newLocation);
        setLastAt(newLocation.timestamp);
        setLocationHistory(prev => [...prev.slice(-4), newLocation]); // Keep last 5 locations
        setError("");
        setStatus(`📍 GPS locked • ${Math.round(accuracy)}m accuracy`);
      },
      (err) => {
        setTrackingActive(false);
        let msg = "";
        if (err.code === err.PERMISSION_DENIED)
          msg = "🚫 Location access denied. Please enable location permissions.";
        else if (err.code === err.POSITION_UNAVAILABLE)
          msg = "📡 GPS signal unavailable. Try moving to an open area.";
        else if (err.code === err.TIMEOUT)
          msg = "⏱️ GPS timeout. Retrying...";
        else msg = err.message || "❌ Unknown GPS error occurred";
        setError(msg);
        setStatus("");
      },
      options
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      setTrackingActive(false);
      setStatus("📍 GPS tracking paused");
    }
  };

  const openInGoogleMaps = () => {
    if (!coords) return;
    const lat = coords.lat.toFixed(6);
    const lng = coords.lng.toFixed(6);
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  const getAccuracyInfo = () => {
    if (!coords?.accuracy) return { level: "Unknown", color: "gray", description: "No data" };
    
    const a = coords.accuracy;
    if (a <= 5) return { level: "Excellent", color: "emerald", description: "GPS locked" };
    if (a <= 15) return { level: "High", color: "green", description: "Very precise" };
    if (a <= 50) return { level: "Good", color: "yellow", description: "Good signal" };
    if (a <= 100) return { level: "Fair", color: "orange", description: "Moderate signal" };
    return { level: "Poor", color: "red", description: "Weak signal" };
  };

  const accuracyInfo = getAccuracyInfo();

  const mapStyles = [
    { id: 'default', name: 'Default', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { id: 'satellite', name: 'Satellite', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { id: 'terrain', name: 'Terrain', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' }
  ];

  const currentMapStyle = mapStyles.find(style => style.id === mapStyle);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading TourShield...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <main className="relative z-10 min-h-screen">
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-7xl mx-auto">
            {/* Title */}
            <div className="text-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
              >
                Live Location Tracking
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-slate-300 text-lg"
              >
                Real-time GPS monitoring with precision tracking
              </motion.p>
            </div>

            {/* Status Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* GPS Status */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Activity className={`w-5 h-5 mr-2 ${trackingActive ? 'text-green-400' : 'text-red-400'}`} />
                    GPS Status
                  </h3>
                  {trackingActive ? (
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-3 h-3 bg-green-400 rounded-full"
                    />
                  ) : (
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                  )}
                </div>
                <p className="text-slate-300 text-sm">{status}</p>
                {lastAt && (
                  <p className="text-slate-400 text-xs mt-2 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    {lastAt.toLocaleTimeString()}
                  </p>
                )}
              </motion.div>

              {/* Accuracy Info */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-cyan-400" />
                  Precision
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">{accuracyInfo.description}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    accuracyInfo.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                    accuracyInfo.color === 'green' ? 'bg-green-500/20 text-green-400' :
                    accuracyInfo.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                    accuracyInfo.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                    accuracyInfo.color === 'red' ? 'bg-red-500/20 text-red-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {accuracyInfo.level}
                  </span>
                </div>
                {coords?.accuracy && (
                  <p className="text-slate-400 text-sm mt-2">±{Math.round(coords.accuracy)}m radius</p>
                )}
              </motion.div>

              {/* Controls */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Navigation className="w-5 h-5 mr-2 text-purple-400" />
                  Controls
                </h3>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={trackingActive ? stopLocationTracking : startLocationTracking}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      trackingActive 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {trackingActive ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Stop Tracking
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Start Tracking
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => setFollow(!follow)}
                    className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      follow 
                        ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                        : 'bg-slate-600/20 text-slate-400 hover:bg-slate-600/30'
                    }`}
                  >
                    <Crosshair className="w-4 h-4" />
                    {follow ? 'Following' : 'Manual'}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Coordinates Display */}
            {coords && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-6 mb-6"
              >
                <div className="grid md:grid-cols-4 gap-4 items-center">
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Latitude</p>
                    <p className="font-mono text-lg font-semibold text-white">{coords.lat.toFixed(6)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-400 text-sm mb-1">Longitude</p>
                    <p className="font-mono text-lg font-semibold text-white">{coords.lng.toFixed(6)}</p>
                  </div>
                  {coords.speed && (
                    <div className="text-center">
                      <p className="text-slate-400 text-sm mb-1">Speed</p>
                      <p className="font-mono text-lg font-semibold text-cyan-400">{coords.speed} km/h</p>
                    </div>
                  )}
                  <div className="text-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={openInGoogleMaps}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold text-white hover:shadow-lg transition-all flex items-center gap-2 mx-auto"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open in Maps
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Map Section */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="px-4 sm:px-6 lg:px-8 pb-8"
        >
          <div className="max-w-7xl mx-auto">
            {/* Map Controls */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Globe className="w-5 h-5 mr-2 text-cyan-400" />
                Live Map View
              </h3>
              <div className="flex items-center gap-2">
                {mapStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setMapStyle(style.id)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      mapStyle === style.id
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700/70'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Map Container */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-sm">
              {coords ? (
                <MapContainer
                  center={[coords.lat, coords.lng]}
                  zoom={16}
                  style={{ height: "70vh", width: "100%" }}
                  className="rounded-2xl"
                >
                  <TileLayer
                    url={currentMapStyle.url}
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {follow && <RecenterOnPosition position={[coords.lat, coords.lng]} zoom={16} />}
                  
                  <Marker 
                    position={[coords.lat, coords.lng]} 
                    icon={createCustomIcon()}
                  >
                    <Popup className="custom-popup">
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-4 h-4 text-cyan-500" />
                          <span className="font-semibold">Your Location</span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Lat: {coords.lat.toFixed(6)}</p>
                          <p>Lng: {coords.lng.toFixed(6)}</p>
                          <p>Accuracy: ±{Math.round(coords.accuracy)}m</p>
                          {coords.speed && <p>Speed: {coords.speed} km/h</p>}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {coords.accuracy && (
                    <Circle 
                      center={[coords.lat, coords.lng]} 
                      radius={Math.min(coords.accuracy, 200)}
                      pathOptions={{
                        fillColor: '#06b6d4',
                        fillOpacity: 0.1,
                        color: '#06b6d4',
                        weight: 1
                      }}
                    />
                  )}
                </MapContainer>
              ) : (
                <div className="flex items-center justify-center h-96 bg-slate-800/60">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Satellite className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
                    </motion.div>
                    <p className="text-slate-300 text-lg">Acquiring GPS signal...</p>
                    <p className="text-slate-400 text-sm mt-2">Please wait while we locate you</p>
                  </div>
                </div>
              )}
            </div>

            {/* Location History */}
            {locationHistory.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="mt-6 bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
              >
                <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-purple-400" />
                  Recent Locations
                </h4>
                <div className="space-y-2">
                  {locationHistory.slice(-3).reverse().map((location, index) => (
                    <div key={location.timestamp.getTime()} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-400' : 'bg-slate-400'}`} />
                        <div>
                          <p className="text-sm text-white font-mono">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {location.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400">
                        ±{Math.round(location.accuracy)}m
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
