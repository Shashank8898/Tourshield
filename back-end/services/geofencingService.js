// services/geofencingService.js
import io from 'socket.io-client';

class GeofencingService {
  constructor() {
    this.socket = null;
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.isConnected = false;
    this.currentRoom = null;
    this.eventListeners = new Map();
  }

  // Initialize socket connection
  connect() {
    if (this.socket) return;

    this.socket = io(this.baseURL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id);
      this.isConnected = true;
      this.emit('connection-status', 'connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      this.isConnected = false;
      this.emit('connection-status', 'disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.emit('connection-status', 'error');
    });

    // Room events
    this.socket.on('member-joined', (data) => {
      this.emit('member-joined', data);
    });

    this.socket.on('member-left', (data) => {
      this.emit('member-left', data);
    });

    this.socket.on('member-offline', (data) => {
      this.emit('member-offline', data);
    });

    this.socket.on('location-update', (data) => {
      this.emit('location-update', data);
    });

    this.socket.on('geo-fence-alert', (data) => {
      this.emit('geo-fence-alert', data);
    });

    this.socket.on('emergency-alert', (data) => {
      this.emit('emergency-alert', data);
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  // API Methods

  // Get all available rooms
  async getRooms() {
    try {
      const response = await fetch(`${this.baseURL}/api/geofencing/rooms`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  }

  // Create new room
  async createRoom(roomData) {
    try {
      const response = await fetch(`${this.baseURL}/api/geofencing/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roomData)
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  // Get room details
  async getRoomDetails(roomId) {
    try {
      const response = await fetch(`${this.baseURL}/api/geofencing/rooms/${roomId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching room details:', error);
      throw error;
    }
  }

  // Join room via socket
  joinRoom(roomId, userId, userName) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.currentRoom = roomId;
    this.socket.emit('join-room', { roomId, userId, userName });
  }

  // Leave room
  leaveRoom() {
    if (this.socket && this.currentRoom) {
      this.socket.emit('leave-room');
      this.currentRoom = null;
    }
  }

  // Send location update
  updateLocation(location) {
    if (this.socket && this.currentRoom) {
      this.socket.emit('location-update', { location });
    }
  }

  // Send emergency SOS
  sendEmergencySOS(location, message = '') {
    if (this.socket && this.currentRoom) {
      this.socket.emit('emergency-sos', { location, message });
    }
    
    // Also send to REST API for logging
    return this.sendEmergencySOSAPI(location, message);
  }

  // Send emergency SOS via API
  async sendEmergencySOSAPI(location, message, roomId) {
    try {
      const response = await fetch(`${this.baseURL}/api/emergency/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getCurrentUserId(),
          location,
          message,
          roomId: roomId || this.currentRoom
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending emergency SOS:', error);
      throw error;
    }
  }

  // Update room settings
  async updateRoomSettings(roomId, settings) {
    try {
      const response = await fetch(`${this.baseURL}/api/geofencing/rooms/${roomId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.getCurrentUserId(),
          ...settings
        })
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating room settings:', error);
      throw error;
    }
  }

  // Get room statistics
  async getRoomStats(roomId) {
    try {
      const response = await fetch(`${this.baseURL}/api/geofencing/rooms/${roomId}/stats`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching room stats:', error);
      throw error;
    }
  }

  // Utility methods
  getCurrentUserId() {
    // Get from your auth system
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.id || 'anonymous';
  }

  getCurrentUserName() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    return user.name || 'Anonymous User';
  }

  // Location utilities
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }

  // Calculate distance between two points
  calculateDistance(pos1, pos2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI / 180;
    const φ2 = pos2.lat * Math.PI / 180;
    const Δφ = (pos2.lat - pos1.lat) * Math.PI / 180;
    const Δλ = (pos2.lng - pos1.lng) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
}

// Create singleton instance
const geofencingService = new GeofencingService();
export default geofencingService;

// React Hook for using the geofencing service
import { useState, useEffect, useCallback } from 'react';

export const useGeofencing = () => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Connect to service
    geofencingService.connect();

    // Set up event listeners
    const handleConnectionStatus = (status) => {
      setConnectionStatus(status);
    };

    const handleMemberJoined = (data) => {
      setRoomMembers(prev => [...prev, data.member]);
      setCurrentRoom(data.room);
    };

    const handleMemberLeft = (data) => {
      setRoomMembers(prev => prev.filter(m => m.id !== data.userId));
    };

    const handleLocationUpdate = (data) => {
      setRoomMembers(prev => 
        prev.map(member => 
          member.id === data.userId 
            ? { ...member, lastLocation: data.location, lastUpdate: data.timestamp }
            : member
        )
      );
    };

    const handleGeoFenceAlert = (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]); // Keep last 10 alerts
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('Geo-fence Alert', {
          body: alert.message,
          icon: '/favicon.ico',
          tag: 'geofence-alert'
        });
      }
    };

    const handleEmergencyAlert = (alert) => {
      setAlerts(prev => [alert, ...prev.slice(0, 9)]);
      
      // Show urgent notification
      if (Notification.permission === 'granted') {
        new Notification('🚨 EMERGENCY ALERT', {
          body: alert.message,
          icon: '/favicon.ico',
          tag: 'emergency-alert',
          requireInteraction: true
        });
      }
    };

    const handleError = (error) => {
      console.error('Geofencing service error:', error);
    };

    // Register listeners
    geofencingService.on('connection-status', handleConnectionStatus);
    geofencingService.on('member-joined', handleMemberJoined);
    geofencingService.on('member-left', handleMemberLeft);
    geofencingService.on('location-update', handleLocationUpdate);
    geofencingService.on('geo-fence-alert', handleGeoFenceAlert);
    geofencingService.on('emergency-alert', handleEmergencyAlert);
    geofencingService.on('error', handleError);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      // Cleanup listeners
      geofencingService.off('connection-status', handleConnectionStatus);
      geofencingService.off('member-joined', handleMemberJoined);
      geofencingService.off('member-left', handleMemberLeft);
      geofencingService.off('location-update', handleLocationUpdate);
      geofencingService.off('geo-fence-alert', handleGeoFenceAlert);
      geofencingService.off('emergency-alert', handleEmergencyAlert);
      geofencingService.off('error', handleError);
      
      geofencingService.disconnect();
    };
  }, []);

  // Location tracking effect
  useEffect(() => {
    let watchId = null;

    if (isTracking && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: Date.now()
          };
          
          setUserLocation(location);
          geofencingService.updateLocation(location);
        },
        (error) => {
          console.error('Location tracking error:', error);
          setConnectionStatus('error');
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10000,
          timeout: 5000
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isTracking]);

  // API methods wrapped in useCallback
  const fetchRooms = useCallback(async () => {
    try {
      const response = await geofencingService.getRooms();
      if (response.success) {
        setRooms(response.rooms);
      }
      return response;
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      throw error;
    }
  }, []);

  const createRoom = useCallback(async (roomData) => {
    try {
      const response = await geofencingService.createRoom(roomData);
      if (response.success) {
        setCurrentRoom(response.room);
        setRoomMembers([response.room.members[0]]); // Creator
      }
      return response;
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }, []);

  const joinRoom = useCallback(async (roomId) => {
    try {
      const userId = geofencingService.getCurrentUserId();
      const userName = geofencingService.getCurrentUserName();
      
      // Join via socket
      geofencingService.joinRoom(roomId, userId, userName);
      
      // Fetch room details
      const response = await geofencingService.getRoomDetails(roomId);
      if (response.success) {
        setCurrentRoom(response.room);
        setRoomMembers(response.room.members);
      }
      
      setIsTracking(true);
      return response;
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }, []);

  const leaveRoom = useCallback(() => {
    geofencingService.leaveRoom();
    setCurrentRoom(null);
    setRoomMembers([]);
    setAlerts([]);
    setIsTracking(false);
  }, []);

  const sendEmergencySOS = useCallback(async (message = '') => {
    if (!userLocation) {
      throw new Error('Location not available');
    }
    
    try {
      const response = await geofencingService.sendEmergencySOS(userLocation, message);
      return response;
    } catch (error) {
      console.error('Failed to send emergency SOS:', error);
      throw error;
    }
  }, [userLocation]);

  return {
    // State
    rooms,
    currentRoom,
    userLocation,
    roomMembers,
    alerts,
    connectionStatus,
    isTracking,
    
    // Actions
    fetchRooms,
    createRoom,
    joinRoom,
    leaveRoom,
    sendEmergencySOS,
    setIsTracking,
    
    // Service instance for advanced usage
    service: geofencingService
  };
};