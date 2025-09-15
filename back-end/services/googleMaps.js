const axios = require('axios')

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY
    this.baseUrl = 'https://maps.googleapis.com/maps/api'
  }

  async getDirections(origin, destination, waypoints = [], travelMode = 'driving') {
    try {
      // First, check if this is a feasible route
      const routeFeasibility = await this.checkRouteFeasibility(origin, destination, travelMode)
      
      if (!routeFeasibility.feasible) {
        return this.generateAlternativeRoute(origin, destination, routeFeasibility.reason, travelMode)
      }

      const params = {
        origin: origin,
        destination: destination,
        mode: travelMode.toLowerCase(),
        key: this.apiKey,
        alternatives: true,
        avoid: 'tolls'
      }

      if (waypoints.length > 0) {
        params.waypoints = waypoints.join('|')
      }

      console.log('🗺️ Requesting directions from Google Maps...')
      const response = await axios.get(`${this.baseUrl}/directions/json`, { params })
      
      if (response.data.status === 'ZERO_RESULTS') {
        console.log('⚠️ No direct route found, generating alternative...')
        return this.generateAlternativeRoute(origin, destination, 'no_direct_route', travelMode)
      }
      
      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`)
      }

      console.log('✅ Got directions from Google Maps')
      return this.parseDirectionsResponse(response.data)
      
    } catch (error) {
      console.error('Google Maps API error:', error.message)
      
      // Try to provide alternative route instead of failing
      console.log('🔄 Attempting to generate alternative route...')
      return this.generateAlternativeRoute(origin, destination, 'api_error', travelMode)
    }
  }

  async checkRouteFeasibility(origin, destination, travelMode) {
    try {
      // Get coordinates for both locations
      const originCoords = await this.geocodeAddress(origin)
      const destCoords = await this.geocodeAddress(destination)
      
      // Calculate straight-line distance
      const distance = this.calculateDistance(originCoords, destCoords)
      
      // Check if route is feasible based on distance and travel mode
      if (travelMode === 'driving' && distance > 10000) { // > 10,000 km
        return { 
          feasible: false, 
          reason: 'international_long_distance',
          distance: distance,
          originCoords,
          destCoords
        }
      }
      
      // Check if crossing major water bodies (simplified check)
      const crossesOcean = this.checkOceanCrossing(originCoords, destCoords)
      if (travelMode === 'driving' && crossesOcean) {
        return { 
          feasible: false, 
          reason: 'ocean_crossing',
          distance: distance,
          originCoords,
          destCoords
        }
      }
      
      return { 
        feasible: true, 
        distance: distance,
        originCoords,
        destCoords
      }
      
    } catch (error) {
      // If we can't check feasibility, assume it's feasible
      return { feasible: true }
    }
  }

  async generateAlternativeRoute(origin, destination, reason, originalTravelMode) {
    console.log(`🛠️ Generating alternative route due to: ${reason}`)
    
    try {
      const originCoords = await this.geocodeAddress(origin)
      const destCoords = await this.geocodeAddress(destination)
      const distance = this.calculateDistance(originCoords, destCoords)
      
      // Generate multi-modal route suggestion
      const alternativeRoute = this.createAlternativeRoute(origin, destination, distance, reason, originalTravelMode)
      
      return alternativeRoute
      
    } catch (error) {
      console.error('Failed to generate alternative route:', error.message)
      
      // Return a basic fallback route
      return this.createFallbackRoute(origin, destination)
    }
  }

  createAlternativeRoute(origin, destination, distance, reason, originalTravelMode) {
    const distanceText = `${Math.round(distance)} km`
    let estimatedDuration = ''
    let routeSegments = []
    let routeType = 'multi-modal'

    if (reason === 'ocean_crossing' || reason === 'international_long_distance') {
      // Suggest flight + ground transportation
      const flightDuration = Math.max(2, Math.round(distance / 800)) // Rough flight time estimation
      const groundTime = 2 // Airport transfers, etc.
      
      estimatedDuration = `${flightDuration + groundTime} hours (including transfers)`
      
      routeSegments = [
        {
          from: origin,
          to: `${origin} Airport`,
          distance: '50 km (estimated)',
          duration: '1 hour',
          mode: 'ground_transport',
          safetyScore: 8.5,
          coordinates: {
            start: { lat: 0, lng: 0 }, // Will be populated with real coords
            end: { lat: 0, lng: 0 }
          }
        },
        {
          from: `${origin} Airport`,
          to: `${destination} Airport`,
          distance: `${Math.round(distance - 100)} km`,
          duration: `${flightDuration} hours`,
          mode: 'flight',
          safetyScore: 9.0,
          coordinates: {
            start: { lat: 0, lng: 0 },
            end: { lat: 0, lng: 0 }
          }
        },
        {
          from: `${destination} Airport`,
          to: destination,
          distance: '50 km (estimated)',
          duration: '1 hour',
          mode: 'ground_transport',
          safetyScore: 8.0,
          coordinates: {
            start: { lat: 0, lng: 0 },
            end: { lat: 0, lng: 0 }
          }
        }
      ]
    } else {
      // For other cases, suggest the best available alternative
      const estimatedHours = Math.round(distance / 60) // Rough driving estimate
      estimatedDuration = `${estimatedHours} hours (estimated)`
      
      routeSegments = [
        {
          from: origin,
          to: destination,
          distance: distanceText,
          duration: estimatedDuration,
          mode: originalTravelMode,
          safetyScore: 7.5,
          coordinates: {
            start: { lat: 0, lng: 0 },
            end: { lat: 0, lng: 0 }
          }
        }
      ]
    }

    return {
      totalDistance: distanceText,
      totalDuration: estimatedDuration,
      routeSegments,
      polyline: '',
      isAlternative: true,
      alternativeReason: reason
    }
  }

  createFallbackRoute(origin, destination) {
    return {
      totalDistance: 'Distance calculation unavailable',
      totalDuration: 'Duration calculation unavailable',
      routeSegments: [
        {
          from: origin,
          to: destination,
          distance: 'Unknown',
          duration: 'Unknown',
          mode: 'mixed',
          safetyScore: 7.0,
          coordinates: {
            start: { lat: 0, lng: 0 },
            end: { lat: 0, lng: 0 }
          }
        }
      ],
      polyline: '',
      isAlternative: true,
      alternativeReason: 'calculation_error'
    }
  }

  calculateDistance(coord1, coord2) {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(coord2.lat - coord1.lat)
    const dLon = this.toRadians(coord2.lng - coord1.lng)
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180)
  }

  checkOceanCrossing(coord1, coord2) {
    // Simplified check for major ocean crossings
    const distance = this.calculateDistance(coord1, coord2)
    const latDiff = Math.abs(coord1.lat - coord2.lat)
    const lngDiff = Math.abs(coord1.lng - coord2.lng)
    
    // If distance > 3000km and large longitude difference, likely ocean crossing
    return distance > 3000 && lngDiff > 30
  }

  parseDirectionsResponse(data) {
    const route = data.routes[0]
    const legs = route.legs
    
    let totalDistance = 0
    let totalDuration = 0
    const routeSegments = []

    legs.forEach((leg, index) => {
      totalDistance += leg.distance.value
      totalDuration += leg.duration.value

      routeSegments.push({
        from: leg.start_address,
        to: leg.end_address,
        distance: leg.distance.text,
        duration: leg.duration.text,
        mode: 'driving',
        coordinates: {
          start: { lat: leg.start_location.lat, lng: leg.start_location.lng },
          end: { lat: leg.end_location.lat, lng: leg.end_location.lng }
        }
      })
    })

    return {
      totalDistance: `${Math.round(totalDistance / 1000)} km`,
      totalDuration: `${Math.round(totalDuration / 3600)} hours ${Math.round((totalDuration % 3600) / 60)} minutes`,
      routeSegments,
      polyline: route.overview_polyline.points,
      isAlternative: false
    }
  }

  async geocodeAddress(address) {
    try {
      const params = {
        address: address,
        key: this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, { params })
      
      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location
        return { lat: location.lat, lng: location.lng }
      }
      
      throw new Error('Location not found')
    } catch (error) {
      console.error('Geocoding error:', error.message)
      // Return approximate coordinates for major cities as fallback
      return this.getFallbackCoordinates(address)
    }
  }

  getFallbackCoordinates(address) {
    const fallbackCoords = {
      'delhi': { lat: 28.6139, lng: 77.2090 },
      'mumbai': { lat: 19.0760, lng: 72.8777 },
      'bangalore': { lat: 12.9716, lng: 77.5946 },
      'japan': { lat: 36.2048, lng: 138.2529 },
      'tokyo': { lat: 35.6762, lng: 139.6503 },
      'new york': { lat: 40.7128, lng: -74.0060 },
      'london': { lat: 51.5074, lng: -0.1278 },
      'paris': { lat: 48.8566, lng: 2.3522 }
    }
    
    const cityKey = address.toLowerCase().trim()
    return fallbackCoords[cityKey] || { lat: 0, lng: 0 }
  }
}

module.exports = new GoogleMapsService()
