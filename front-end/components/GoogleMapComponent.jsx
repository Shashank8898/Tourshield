import React, { useEffect, useRef, useState } from 'react';
import googleMapsService from '../services/googleMapsService';
import { MapPin, Navigation, Target, Users, AlertTriangle } from 'lucide-react';

const GoogleMapComponent = ({ 
  currentRoom, 
  userLocation, 
  roomMembers, 
  onLocationUpdate,
  className = "w-full h-full"
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const geoFenceCircleRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Initialize map
  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, []);

  // Update map when data changes
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded) {
      updateMapContent();
    }
  }, [currentRoom, userLocation, roomMembers, mapLoaded]);

  const initializeMap = async () => {
    try {
      const center = userLocation || currentRoom?.location || { lat: 28.6139, lng: 77.2090 };
      
      const map = await googleMapsService.createMap(mapRef.current, {
        zoom: currentRoom ? 16 : 12,
        center: center,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: true
      });

      mapInstanceRef.current = map;
      
      // Create info window
      infoWindowRef.current = await googleMapsService.createInfoWindow();

      // Add click listener for location updates
      map.addListener('click', (event) => {
        const location = {
          lat: event.latLng.lat(),
          lng: event.latLng.lng()
        };
        onLocationUpdate?.(location);
      });

      setMapLoaded(true);
      console.log('Google Maps loaded successfully');
    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      setMapError(error.message);
    }
  };

  const updateMapContent = async () => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers and circles
    clearMapContent();

    try {
      // Add geo-fence circle if in room
      if (currentRoom && currentRoom.location) {
        await addGeoFenceCircle();
      }

      // Add user location marker
      if (userLocation) {
        await addUserLocationMarker();
      }

      // Add room members markers
      if (roomMembers && roomMembers.length > 0) {
        await addMemberMarkers();
      }

      // Fit bounds to show all markers
      fitBoundsToMarkers();
    } catch (error) {
      console.error('Error updating map content:', error);
    }
  };

  const clearMapContent = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Clear geo-fence circle
    if (geoFenceCircleRef.current) {
      geoFenceCircleRef.current.setMap(null);
      geoFenceCircleRef.current = null;
    }
  };

  const addGeoFenceCircle = async () => {
    const circle = await googleMapsService.createCircle(mapInstanceRef.current, {
      strokeColor: '#06b6d4',
      strokeOpacity: 0.8,
      strokeWeight: 3,
      fillColor: '#06b6d4',
      fillOpacity: 0.15,
      center: currentRoom.location,
      radius: currentRoom.radius,
      clickable: true
    });

    // Add click listener to circle
    circle.addListener('click', () => {
      infoWindowRef.current.setContent(`
        <div style="color: #1e293b; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #0f172a;">Safety Zone</h3>
          <p style="margin: 0; font-size: 14px;">
            Radius: ${currentRoom.radius}m<br>
            Room: ${currentRoom.name}
          </p>
        </div>
      `);
      infoWindowRef.current.setPosition(currentRoom.location);
      infoWindowRef.current.open(mapInstanceRef.current);
    });

    geoFenceCircleRef.current = circle;
  };

  const addUserLocationMarker = async () => {
    const marker = await googleMapsService.createMarker(mapInstanceRef.current, {
      position: userLocation,
      title: 'Your Location',
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#10b981',
        fillOpacity: 1,
        strokeWeight: 3,
        strokeColor: '#ffffff'
      },
      zIndex: 1000
    });

    // Add click listener
    marker.addListener('click', () => {
      const distance = currentRoom ? 
        googleMapsService.calculateDistance(userLocation, currentRoom.location) : 0;
      
      infoWindowRef.current.setContent(`
        <div style="color: #1e293b; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #0f172a;">Your Location</h3>
          <p style="margin: 0; font-size: 14px;">
            Lat: ${userLocation.lat.toFixed(6)}<br>
            Lng: ${userLocation.lng.toFixed(6)}
            ${currentRoom ? `<br>Distance from center: ${Math.round(distance)}m` : ''}
          </p>
        </div>
      `);
      infoWindowRef.current.setPosition(userLocation);
      infoWindowRef.current.open(mapInstanceRef.current, marker);
    });

    markersRef.current.push(marker);
  };

  const addMemberMarkers = async () => {
    for (const member of roomMembers) {
      if (member.lastLocation && member.name !== 'You') {
        const isCreator = member.isCreator;
        const isOnline = member.isOnline;
        
        const marker = await googleMapsService.createMarker(mapInstanceRef.current, {
          position: member.lastLocation,
          title: member.name,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: isCreator ? '#f59e0b' : '#3b82f6',
            fillOpacity: isOnline ? 1 : 0.5,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });

        // Add click listener
        marker.addListener('click', () => {
          const distance = currentRoom ? 
            googleMapsService.calculateDistance(member.lastLocation, currentRoom.location) : 0;
          
          infoWindowRef.current.setContent(`
            <div style="color: #1e293b; padding: 8px;">
              <h3 style="margin: 0 0 8px 0; color: #0f172a;">
                ${member.name} ${isCreator ? '(Creator)' : ''}
              </h3>
              <p style="margin: 0; font-size: 14px;">
                Status: ${isOnline ? 'Online' : 'Offline'}<br>
                ${currentRoom ? `Distance from center: ${Math.round(distance)}m` : ''}
                ${member.joinedAt ? `<br>Joined: ${new Date(member.joinedAt).toLocaleTimeString()}` : ''}
              </p>
            </div>
          `);
          infoWindowRef.current.setPosition(member.lastLocation);
          infoWindowRef.current.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
      }
    }
  };

  const fitBoundsToMarkers = () => {
    if (markersRef.current.length === 0) return;

    const bounds = new window.google.maps.LatLngBounds();
    
    // Add all marker positions to bounds
    markersRef.current.forEach(marker => {
      bounds.extend(marker.getPosition());
    });

    // Add geo-fence circle bounds if exists
    if (geoFenceCircleRef.current) {
      bounds.extend(geoFenceCircleRef.current.getBounds().getNorthEast());
      bounds.extend(geoFenceCircleRef.current.getBounds().getSouthWest());
    }

    mapInstanceRef.current.fitBounds(bounds);
    
    // Ensure minimum zoom level
    const listener = mapInstanceRef.current.addListener('idle', () => {
      if (mapInstanceRef.current.getZoom() > 18) {
        mapInstanceRef.current.setZoom(18);
      }
      window.google.maps.event.removeListener(listener);
    });
  };

  // Map control functions
  const centerOnUser = async () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(userLocation);
      mapInstanceRef.current.setZoom(17);
    } else {
      try {
        const location = await googleMapsService.getCurrentLocation();
        onLocationUpdate?.(location);
        mapInstanceRef.current.panTo(location);
        mapInstanceRef.current.setZoom(17);
      } catch (error) {
        console.error('Failed to get current location:', error);
      }
    }
  };

  const centerOnRoom = () => {
    if (currentRoom?.location && mapInstanceRef.current) {
      mapInstanceRef.current.panTo(currentRoom.location);
      mapInstanceRef.current.setZoom(16);
    }
  };

  const toggleMapType = () => {
    if (!mapInstanceRef.current) return;
    
    const currentType = mapInstanceRef.current.getMapTypeId();
    const newType = currentType === 'roadmap' ? 'satellite' : 'roadmap';
    mapInstanceRef.current.setMapTypeId(newType);
  };

  if (mapError) {
    return (
      <div className={`${className} bg-slate-800 flex items-center justify-center`}>
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Map Loading Failed</h3>
          <p className="text-slate-300 mb-4">Error: {mapError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Loading Overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-300">Loading Google Maps...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={centerOnUser}
            className="p-3 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-sm border border-slate-600 rounded-lg text-white transition-colors"
            title="Center on your location"
          >
            <Navigation className="w-5 h-5" />
          </button>
          
          {currentRoom && (
            <button
              onClick={centerOnRoom}
              className="p-3 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-sm border border-slate-600 rounded-lg text-white transition-colors"
              title="Center on geo-fence"
            >
              <Target className="w-5 h-5" />
            </button>
          )}
          
          <button
            onClick={toggleMapType}
            className="p-3 bg-slate-800/90 hover:bg-slate-700/90 backdrop-blur-sm border border-slate-600 rounded-lg text-white transition-colors"
            title="Toggle satellite view"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Map Legend */}
      {mapLoaded && currentRoom && (
        <div className="absolute bottom-4 left-4 bg-slate-800/90 backdrop-blur-sm border border-slate-600 rounded-lg p-4 text-white">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Map Legend
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Room Members</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Room Creator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-cyan-400 rounded-full bg-cyan-400/20"></div>
              <span>Safe Zone ({currentRoom.radius}m)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapComponent;