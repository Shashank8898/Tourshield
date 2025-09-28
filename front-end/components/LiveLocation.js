"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import GoogleMapComponent from '@/components/GoogleMapComponent'; // Assume this is a pre-built Google Map component
import { 
  MapPin, 
  Users, 
  Shield, 
  Plus, 
  Settings, 
  AlertTriangle,
  Navigation,
  Target,
  Wifi,
  WifiOff,
  Bell,
  Copy,
  Share2,
  Phone,
  X,
  CheckCircle
} from 'lucide-react';

// Mock the geofencing hook with proper dependency management
const useGeofencing = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [isTracking, setIsTracking] = useState(false);

  // Use useCallback to prevent infinite re-renders
  const fetchRooms = useCallback(async () => {
    try {
      // Mock data
      const mockRooms = [
        { 
          id: 'ROOM001', 
          name: 'Goa Beach Trek', 
          creatorName: 'Rahul Kumar',
          memberCount: 4, 
          radius: 1000,
          location: { lat: 15.2993, lng: 74.1240 }
        },
        { 
          id: 'ROOM002', 
          name: 'Manali Adventure Group', 
          creatorName: 'Priya Singh',
          memberCount: 6, 
          radius: 750,
          location: { lat: 32.2432, lng: 77.1892 }
        }
      ];
      setRooms(mockRooms);
      return { success: true, rooms: mockRooms };
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return { success: false, rooms: [] };
    }
  }, []); // Empty dependency array since this doesn't depend on any state

  const createRoom = useCallback(async (roomData) => {
    try {
      const newRoom = {
        id: `ROOM${String(Date.now()).slice(-3).padStart(3, '0')}`, // Use timestamp to avoid dependency on rooms.length
        name: roomData.name,
        creatorName: roomData.creatorName,
        memberCount: 1,
        radius: roomData.geoFence.radius,
        location: roomData.geoFence.center
      };
      setRooms(prev => [...prev, newRoom]);
      setCurrentRoom(newRoom);
      return { success: true, room: newRoom };
    } catch (error) {
      console.error('Failed to create room:', error);
      return { success: false, room: null };
    }
  }, []);

  const joinRoom = useCallback(async (roomId) => {
    try {
      setRooms(prevRooms => {
        const room = prevRooms.find(r => r.id === roomId);
        if (room) {
          setCurrentRoom(room);
          setRoomMembers([
            { id: 1, name: room.creatorName, isCreator: true, isOnline: true, location: room.location },
            { id: 2, name: 'You', isCreator: false, isOnline: true, location: null }
          ]);
          setIsTracking(true);
          return prevRooms;
        }
        return prevRooms;
      });
      return { success: true };
    } catch (error) {
      console.error('Failed to join room:', error);
      return { success: false };
    }
  }, []);

  const leaveRoom = useCallback(() => {
    setCurrentRoom(null);
    setRoomMembers([]);
    setAlerts([]);
    setIsTracking(false);
  }, []);

  const sendEmergencySOS = useCallback(async (message) => {
    try {
      const alert = {
        id: Date.now(),
        type: 'emergency-sos',
        message: `🚨 Emergency SOS sent! ${message}`,
        timestamp: new Date().toLocaleTimeString(),
        severity: 'critical'
      };
      setAlerts(prev => [alert, ...prev.slice(0, 4)]); // Keep only last 5 alerts
      return { success: true, emergencyId: alert.id };
    } catch (error) {
      console.error('Failed to send SOS:', error);
      return { success: false };
    }
  }, []);

  return {
    rooms,
    currentRoom,
    userLocation,
    roomMembers,
    alerts,
    connectionStatus,
    isTracking,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    sendEmergencySOS,
    setIsTracking,
    setUserLocation
  };
};

const IntegratedGeoFencing = () => {
  const {
    rooms,
    currentRoom,
    userLocation,
    roomMembers,
    alerts,
    connectionStatus,
    isTracking,
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    sendEmergencySOS,
    setIsTracking,
    setUserLocation
  } = useGeofencing();

  const [currentView, setCurrentView] = useState('lobby');
  const [roomCode, setRoomCode] = useState('');
  const [userName, setUserName] = useState('');
  const [geoFenceRadius, setGeoFenceRadius] = useState(500);
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosMessage, setSOSMessage] = useState('');
  const [showNotification, setShowNotification] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const geoFenceCircleRef = useRef(null);

  // Check geolocation permission on mount
  useEffect(() => {
    const checkLocationPermission = async () => {
      try {
        if ('permissions' in navigator) {
          const permission = await navigator.permissions.query({name: 'geolocation'});
          setLocationPermission(permission.state);
          
          permission.onchange = () => {
            setLocationPermission(permission.state);
          };
        }
      } catch (error) {
        console.warn('Could not check location permission:', error);
      }
    };

    checkLocationPermission();
  }, []);

  // Initialize Google Maps
  useEffect(() => {
    if (currentView === 'room' && mapRef.current && window.google && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [currentView, userLocation]);

  // Update map when location or members change
  useEffect(() => {
    if (mapInstanceRef.current && currentRoom) {
      updateMapMarkers();
    }
  }, [roomMembers, userLocation, currentRoom]);

  // Handle geo-fence alerts with proper cleanup
  useEffect(() => {
    if (alerts.length > 0) {
      const latestAlert = alerts[0];
      if (latestAlert.type === 'geo-fence-breach') {
        showNotificationPopup('Geo-fence Alert', latestAlert.message, 'warning');
      } else if (latestAlert.type === 'emergency-sos') {
        showNotificationPopup('Emergency Alert', latestAlert.message, 'critical');
      }
    }
  }, [alerts.length]); // Only trigger when alerts count changes

  // Fetch rooms on component mount - Fixed with proper dependency
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]); // Now fetchRooms is memoized with useCallback

  // Location tracking with improved error handling
  useEffect(() => {
    let watchId = null;

    const startLocationTracking = () => {
      if (!isTracking || !navigator.geolocation) return;

      const options = {
        enableHighAccuracy: true,
        maximumAge: 30000, // Accept cached position up to 30 seconds old
        timeout: 10000     // Timeout after 10 seconds
      };

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          // For demo purposes, use mock location near geo-fence when available
          const demoLocation = currentRoom ? {
            lat: currentRoom.location.lat + (Math.random() - 0.5) * 0.002,
            lng: currentRoom.location.lng + (Math.random() - 0.5) * 0.002,
            accuracy: Math.floor(Math.random() * 20) + 5,
            timestamp: Date.now()
          } : location;

          setUserLocation(demoLocation);
          
          // Update room members with user location
          if (currentRoom) {
            setRoomMembers(prevMembers => 
              prevMembers.map(member => 
                member.name === 'You' 
                  ? { ...member, location: demoLocation, isOnline: true }
                  : member
              )
            );
          }
          
          // Simulate geo-fence breach check (for demo)
          if (currentRoom && Math.random() > 0.98) { // 2% chance for demo
            const distance = Math.floor(Math.random() * 300 + currentRoom.radius);
            const alert = {
              id: Date.now(),
              type: 'geo-fence-breach',
              message: `Movement detected outside safe zone! Distance: ${distance}m from center`,
              timestamp: new Date().toLocaleTimeString(),
              severity: 'high'
            };
            setAlerts(prev => [alert, ...prev.slice(0, 4)]);
          }
        },
        (error) => {
          let errorMessage = 'Location access denied';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied. Please enable location services.';
              setLocationPermission('denied');
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
            default:
              errorMessage = 'An unknown location error occurred.';
              break;
          }
          console.warn('Geolocation error:', errorMessage);
          
          // Show notification for location errors
          showNotificationPopup('Location Error', errorMessage, 'warning');
        },
        options
      );
    };

    startLocationTracking();

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking, currentRoom]); // Removed setUserLocation and setRoomMembers from deps

  const initializeMap = useCallback(() => {
    const center = userLocation || currentRoom?.location || { lat: 28.6139, lng: 77.2090 };
    
    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 15,
        center: center,
        styles: [
          {
            "elementType": "geometry",
            "stylers": [{"color": "#1e293b"}]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#8b949e"}]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#1e293b"}]
          }
        ]
      });

      mapInstanceRef.current = map;

      // Add geo-fence circle if in room
      if (currentRoom) {
        const circle = new window.google.maps.Circle({
          strokeColor: '#06b6d4',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#06b6d4',
          fillOpacity: 0.15,
          map: map,
          center: currentRoom.location,
          radius: currentRoom.radius
        });
        geoFenceCircleRef.current = circle;
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
      showNotificationPopup('Map Error', 'Failed to load map. Please check your internet connection.', 'warning');
    }
  }, [userLocation, currentRoom]);

  const updateMapMarkers = useCallback(() => {
    if (!mapInstanceRef.current) return;

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      // Add user location marker
      if (userLocation) {
        const userMarker = new window.google.maps.Marker({
          position: userLocation,
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#10b981',
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: '#ffffff'
          }
        });
        markersRef.current.push(userMarker);
      }

      // Add member markers
      roomMembers.forEach(member => {
        if (member.location && member.name !== 'You') {
          const memberMarker = new window.google.maps.Marker({
            position: member.location,
            map: mapInstanceRef.current,
            title: member.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: member.isCreator ? '#f59e0b' : '#3b82f6',
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: '#ffffff'
            }
          });
          markersRef.current.push(memberMarker);
        }
      });
    } catch (error) {
      console.error('Failed to update map markers:', error);
    }
  }, [userLocation, roomMembers]);

  const showNotificationPopup = useCallback((title, message, type) => {
    setShowNotification({ title, message, type });
    setTimeout(() => setShowNotification(null), 5000);
  }, []);

  const handleCreateRoom = async () => {
    if (!userName.trim()) {
      showNotificationPopup('Error', 'Please enter your name', 'warning');
      return;
    }

    try {
      const currentLocation = userLocation || await getCurrentLocation();
      const roomData = {
        name: `${userName}'s Safety Group`,
        creatorName: userName,
        geoFence: {
          center: currentLocation,
          radius: geoFenceRadius
        }
      };

      const result = await createRoom(roomData);
      if (result.success) {
        setCurrentView('room');
        setIsTracking(true);
        showNotificationPopup('Success', 'Safety room created successfully!', 'success');
      } else {
        showNotificationPopup('Error', 'Failed to create room', 'warning');
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      showNotificationPopup('Error', 'Failed to create room. Please try again.', 'warning');
    }
  };

  const handleJoinRoom = async (room) => {
    try {
      const result = await joinRoom(room.id);
      if (result.success) {
        setCurrentView('room');
        showNotificationPopup('Success', `Joined ${room.name}`, 'success');
      } else {
        showNotificationPopup('Error', 'Failed to join room', 'warning');
      }
    } catch (error) {
      console.error('Failed to join room:', error);
      showNotificationPopup('Error', 'Failed to join room. Please try again.', 'warning');
    }
  };

  const handleEmergencySOS = async () => {
    try {
      const result = await sendEmergencySOS(sosMessage);
      if (result.success) {
        setShowSOSModal(false);
        setSOSMessage('');
        showNotificationPopup('Emergency SOS Sent', 'Help is on the way!', 'success');
      } else {
        showNotificationPopup('Error', 'Failed to send SOS', 'warning');
      }
    } catch (error) {
      console.error('Failed to send SOS:', error);
      showNotificationPopup('Error', 'Failed to send emergency alert', 'warning');
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Provide fallback location for demo
          console.warn('Using fallback location due to geolocation error:', error);
          resolve({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi
        },
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        }
      );
    });
  };

  // Location Permission Banner
  const LocationPermissionBanner = () => {
    if (locationPermission === 'granted' || locationPermission === 'prompt') return null;

    return (
      <div className="bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 p-4 m-4 rounded-xl">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold">Location Access Required</h4>
            <p className="text-sm opacity-90">
              Please enable location services to use safety room features. Check your browser settings.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Lobby View
  if (currentView === 'lobby') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-12 w-12 text-cyan-400 mr-3" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Safety Rooms
              </h1>
            </div>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Create or join safety groups to share live locations and set geo-fence boundaries for enhanced travel security
            </p>
          </div>

          {/* Location Permission Banner */}
          <LocationPermissionBanner />

          {/* Connection Status */}
          <div className="flex justify-center mb-8">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
              connectionStatus === 'disconnected' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {connectionStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button
              onClick={() => setCurrentView('create')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-500"
            >
              <Plus className="w-5 h-5" />
              Create Safety Room
            </button>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter room code (e.g., ROOM001)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="px-4 py-4 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => {
                  const room = rooms.find(r => r.id === roomCode);
                  if (room) {
                    handleJoinRoom(room);
                  } else {
                    showNotificationPopup('Error', 'Room not found', 'warning');
                  }
                }}
                className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Available Rooms */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <div key={room.id} className="group p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/50 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{room.name}</h3>
                    <p className="text-slate-400 text-sm">Created by {room.creatorName}</p>
                  </div>
                  <div className="text-xs bg-slate-700 px-2 py-1 rounded-full text-cyan-400 font-mono">
                    {room.id}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-slate-300">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room.memberCount} members
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="w-4 h-4" />
                    {room.radius}m radius
                  </div>
                </div>

                <button
                  onClick={() => handleJoinRoom(room)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all duration-300"
                >
                  Join Safety Group
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Popup */}
        {showNotification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl border backdrop-blur-sm max-w-sm ${
            showNotification.type === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
            showNotification.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
            'bg-green-500/20 border-green-500/50 text-green-400'
          }`}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold">{showNotification.title}</h4>
                <p className="text-sm opacity-90">{showNotification.message}</p>
              </div>
              <button 
                onClick={() => setShowNotification(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Create Room View
  if (currentView === 'create') {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('lobby')}
            className="mb-8 text-slate-400 hover:text-white flex items-center gap-2"
          >
            ← Back to Lobby
          </button>

          {/* Location Permission Banner */}
          <LocationPermissionBanner />

          <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl p-8">
            <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Create Safety Room
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-slate-300 mb-2 font-semibold">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-2 font-semibold">
                  Geo-Fence Radius: {geoFenceRadius}m
                </label>
                <div className="relative">
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={geoFenceRadius}
                    onChange={(e) => setGeoFenceRadius(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-2">
                    <span>100m</span>
                    <span>1000m</span>
                    <span>2000m</span>
                  </div>
                </div>
                <p className="text-slate-400 text-sm mt-2">
                  Set the safety boundary. Members will be alerted if they move outside this radius.
                </p>
              </div>

              <div className="bg-slate-700/30 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                  <Navigation className="w-4 h-4" />
                  Location Services
                </h4>
                <p className="text-slate-300 text-sm">
                  We'll use your current location as the geo-fence center. Make sure location services are enabled.
                </p>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!userName.trim() || locationPermission === 'denied'}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {locationPermission === 'denied' ? 'Location Access Required' : 'Create Safety Room'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Room View
  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                leaveRoom();
                setCurrentView('lobby');
              }}
              className="text-slate-400 hover:text-white"
            >
              ← Leave Room
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{currentRoom?.name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Room: {currentRoom?.id}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(currentRoom?.id);
                    showNotificationPopup('Success', 'Room code copied!', 'success');
                  }}
                  className="flex items-center gap-1 hover:text-cyan-400"
                >
                  <Copy className="w-3 h-3" />
                  Copy Code
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSOSModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-red-500/25 animate-pulse"
            >
              <Phone className="w-4 h-4" />
              Emergency SOS
            </button>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
              connectionStatus === 'disconnected' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {connectionStatus === 'connected' ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connectionStatus}
            </div>
            <div className="text-sm text-slate-300">
              {roomMembers.length} members online
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Map Area */}
        <div className="flex-1 relative">
          <GoogleMapComponent
              currentRoom={currentRoom}
              userLocation={userLocation}
              roomMembers={roomMembers}
              onLocationUpdate={(location) => {
                setUserLocation(location);
                // This will automatically update the backend via your existing service
              }}
              className="w-full h-full"
          />

          {/* Geo-fence Controls */}
          <div className="absolute top-4 left-4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-semibold">Geo-Fence Active</span>
            </div>
            <div className="text-xs text-slate-400">
              Radius: {currentRoom?.radius}m
            </div>
            <div className="text-xs text-slate-500">
              Center: {currentRoom?.location?.lat?.toFixed(4)}, {currentRoom?.location?.lng?.toFixed(4)}
            </div>
          </div>

          {/* Location Status */}
          {userLocation && (
            <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-green-400" />
                <span className="text-sm font-semibold">Location Active</span>
              </div>
              <div className="text-xs text-slate-400">
                Accuracy: ±{Math.round(userLocation.accuracy || 10)}m
              </div>
              <div className="text-xs text-slate-500">
                {userLocation.lat?.toFixed(6)}, {userLocation.lng?.toFixed(6)}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-slate-800/30 border-l border-slate-700 flex flex-col">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Alerts ({alerts.length})
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className={`p-3 rounded-lg text-sm ${
                    alert.severity === 'critical' ? 'bg-red-500/20 border-l-4 border-red-500' :
                    alert.severity === 'high' ? 'bg-yellow-500/20 border-l-4 border-yellow-500' :
                    'bg-blue-500/20 border-l-4 border-blue-500'
                  }`}>
                    <div className="font-semibold">{alert.message}</div>
                    <div className="text-xs text-slate-400 mt-1">{alert.timestamp}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members List */}
          <div className="p-4 flex-1">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Members ({roomMembers.length})
            </h3>
            <div className="space-y-3">
              {roomMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className={`w-3 h-3 rounded-full ${member.isOnline ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {member.name}
                      {member.isCreator && (
                        <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded">
                          Creator
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {member.isOnline ? 'Location sharing active' : 'Offline'}
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>
          </div>

          {/* Room Settings */}
          <div className="p-4 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button 
                onClick={() => setCurrentView('lobby')}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors"
              >
                <Settings className="w-4 h-4 mx-auto" />
              </button>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ 
                      title: currentRoom?.name, 
                      text: `Join my safety room: ${currentRoom?.id}`,
                      url: window.location.href 
                    });
                  } else {
                    navigator.clipboard.writeText(`Join my safety room: ${currentRoom?.id}`);
                    showNotificationPopup('Success', 'Room details copied to clipboard!', 'success');
                  }
                }}
                className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold transition-colors"
              >
                <Share2 className="w-4 h-4 mx-auto" />
              </button>
            </div>
            <button
              onClick={() => {
                leaveRoom();
                setCurrentView('lobby');
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-xl font-semibold transition-colors"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Emergency SOS Modal */}
      {showSOSModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-8 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Emergency SOS</h2>
              <p className="text-slate-300 text-sm">
                This will send an alert to all room members and emergency services
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-slate-300 mb-2 font-semibold">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={sosMessage}
                  onChange={(e) => setSOSMessage(e.target.value)}
                  placeholder="Describe your emergency situation..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-red-400 resize-none"
                  rows={3}
                />
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-red-400 font-semibold mb-1">Emergency contacts will be notified:</p>
                    <ul className="text-slate-300 space-y-1">
                      <li>• Room members with your location</li>
                      <li>• Local police and medical services</li>
                      <li>• Tourist helpline (1363)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSOSModal(false)}
                className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEmergencySOS}
                className="flex-1 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/25 transition-all duration-300"
              >
                Send SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {showNotification && (
        <div className={`fixed top-4 right-4 z-40 p-4 rounded-xl border backdrop-blur-sm max-w-sm ${
          showNotification.type === 'critical' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
          showNotification.type === 'warning' ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
          'bg-green-500/20 border-green-500/50 text-green-400'
        }`}>
          <div className="flex items-start gap-3">
            {showNotification.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold">{showNotification.title}</h4>
              <p className="text-sm opacity-90">{showNotification.message}</p>
            </div>
            <button 
              onClick={() => setShowNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #06b6d4, #3b82f6);
          cursor: pointer;
          box-shadow: 0 0 2px 0 #555;
          transition: background .15s ease-in-out;
        }
        .slider::-webkit-slider-thumb:hover {
          background: linear-gradient(to right, #0891b2, #2563eb);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(to right, #06b6d4, #3b82f6);
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
};

export default IntegratedGeoFencing;