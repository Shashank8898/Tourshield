import { Loader } from "@googlemaps/js-api-loader";

class GoogleMapsService {
  constructor() {
    this.loader = new Loader({
      apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places", "geometry"]
    });
    this.isLoaded = false;
    this.google = null;
  }

  async loadMaps() {
    if (this.isLoaded) return this.google;
    
    try {
      this.google = await this.loader.load();
      this.isLoaded = true;
      return this.google;
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      throw error;
    }
  }

  async createMap(element, options = {}) {
    const google = await this.loadMaps();
    
    const defaultOptions = {
      zoom: 15,
      center: { lat: 28.6139, lng: 77.2090 }, // Delhi default
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          "elementType": "geometry",
          "stylers": [{"color": "#212121"}]
        },
        {
          "elementType": "labels.icon",
          "stylers": [{"visibility": "off"}]
        },
        {
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#757575"}]
        },
        {
          "elementType": "labels.text.stroke",
          "stylers": [{"color": "#212121"}]
        },
        {
          "featureType": "administrative",
          "elementType": "geometry",
          "stylers": [{"color": "#757575"}]
        },
        {
          "featureType": "administrative.country",
          "elementType": "labels.text.fill",
          "stylers": [{"color": "#9e9e9e"}]
        }
      ]
    };

    return new google.maps.Map(element, { ...defaultOptions, ...options });
  }

  async createMarker(map, options = {}) {
    const google = await this.loadMaps();
    return new google.maps.Marker({
      map: map,
      ...options
    });
  }

  async createCircle(map, options = {}) {
    const google = await this.loadMaps();
    return new google.maps.Circle({
      map: map,
      ...options
    });
  }

  async createInfoWindow(options = {}) {
    const google = await this.loadMaps();
    return new google.maps.InfoWindow(options);
  }

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

  async getCurrentLocation() {
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
            accuracy: position.coords.accuracy
          });
        },
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  }
}

// Create singleton instance
const googleMapsService = new GoogleMapsService();
export default googleMapsService;