// Geo utility functions

// Calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Calculate bearing (direction) between two points
function calculateBearing(lat1, lng1, lat2, lng2) {
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180 / Math.PI) + 360) % 360; // Bearing in degrees
}

// Check if point is within circular geo-fence
function isWithinCircularFence(pointLat, pointLng, centerLat, centerLng, radius) {
  const distance = calculateDistance(pointLat, pointLng, centerLat, centerLng);
  return {
    isWithin: distance <= radius,
    distance: Math.round(distance),
    radius
  };
}

// Calculate center point of multiple coordinates
function calculateCenterPoint(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let x = 0;
  let y = 0;
  let z = 0;

  for (const coord of coordinates) {
    const lat = coord.lat * Math.PI / 180;
    const lng = coord.lng * Math.PI / 180;

    x += Math.cos(lat) * Math.cos(lng);
    y += Math.cos(lat) * Math.sin(lng);
    z += Math.sin(lat);
  }

  const total = coordinates.length;
  x = x / total;
  y = y / total;
  z = z / total;

  const centralLng = Math.atan2(y, x);
  const centralSquareRoot = Math.sqrt(x * x + y * y);
  const centralLat = Math.atan2(z, centralSquareRoot);

  return {
    lat: centralLat * 180 / Math.PI,
    lng: centralLng * 180 / Math.PI
  };
}

// Generate optimal fence radius based on member locations
function calculateOptimalFenceRadius(memberLocations, buffer = 1.2) {
  if (!memberLocations || memberLocations.length < 2) {
    return 500; // Default radius
  }

  const center = calculateCenterPoint(memberLocations);
  let maxDistance = 0;

  for (const location of memberLocations) {
    const distance = calculateDistance(
      center.lat, center.lng,
      location.lat, location.lng
    );
    maxDistance = Math.max(maxDistance, distance);
  }

  // Add buffer and ensure minimum radius
  return Math.max(Math.round(maxDistance * buffer), 100);
}

// Validate coordinates
function validateCoordinates(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return { valid: false, error: 'Coordinates must be numbers' };
  }

  if (isNaN(lat) || isNaN(lng)) {
    return { valid: false, error: 'Coordinates cannot be NaN' };
  }

  if (lat < -90 || lat > 90) {
    return { valid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (lng < -180 || lng > 180) {
    return { valid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { valid: true };
}

// Format distance for display
function formatDistance(meters) {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

// Get compass direction from bearing
function getCompassDirection(bearing) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                     'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

// Calculate speed between two location points
function calculateSpeed(location1, location2) {
  if (!location1.timestamp || !location2.timestamp) {
    return null;
  }

  const distance = calculateDistance(
    location1.lat, location1.lng,
    location2.lat, location2.lng
  );

  const timeDiff = (new Date(location2.timestamp) - new Date(location1.timestamp)) / 1000; // seconds
  
  if (timeDiff <= 0) {
    return 0;
  }

  const speedMps = distance / timeDiff; // meters per second
  const speedKmh = (speedMps * 3.6); // km/h

  return Math.round(speedKmh * 10) / 10; // round to 1 decimal
}

// Smooth location data to reduce GPS noise
function smoothLocation(locations, windowSize = 3) {
  if (!locations || locations.length < windowSize) {
    return locations;
  }

  const smoothed = [];
  
  for (let i = 0; i < locations.length; i++) {
    if (i < windowSize - 1) {
      smoothed.push(locations[i]);
      continue;
    }

    let latSum = 0;
    let lngSum = 0;
    
    for (let j = i - windowSize + 1; j <= i; j++) {
      latSum += locations[j].lat;
      lngSum += locations[j].lng;
    }

    smoothed.push({
      ...locations[i],
      lat: latSum / windowSize,
      lng: lngSum / windowSize
    });
  }

  return smoothed;
}

// Check if location update is significant (to reduce unnecessary updates)
function isSignificantLocationChange(oldLocation, newLocation, threshold = 10) {
  if (!oldLocation || !newLocation) {
    return true;
  }

  const distance = calculateDistance(
    oldLocation.lat, oldLocation.lng,
    newLocation.lat, newLocation.lng
  );

  return distance >= threshold;
}

// Generate waypoints for navigation between two points
function generateWaypoints(start, end, intervalMeters = 100) {
  const distance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  const numPoints = Math.floor(distance / intervalMeters);
  
  if (numPoints <= 1) {
    return [start, end];
  }

  const waypoints = [start];
  
  for (let i = 1; i < numPoints; i++) {
    const fraction = i / numPoints;
    
    // Simple linear interpolation (for more accuracy, use great circle interpolation)
    const lat = start.lat + (end.lat - start.lat) * fraction;
    const lng = start.lng + (end.lng - start.lng) * fraction;
    
    waypoints.push({ lat, lng });
  }
  
  waypoints.push(end);
  return waypoints;
}

module.exports = {
  calculateDistance,
  calculateBearing,
  isWithinCircularFence,
  calculateCenterPoint,
  calculateOptimalFenceRadius,
  validateCoordinates,
  formatDistance,
  getCompassDirection,
  calculateSpeed,
  smoothLocation,
  isSignificantLocationChange,
  generateWaypoints
};