const axios = require('axios');

exports.getWeatherData = async (coordinates, travelDates) => {
    try {
        const weatherApiKey = process.env.WEATHER_API_KEY;
        
        if (!weatherApiKey) {
            return getMockWeatherData();
        }

        const response = await axios.get(
            'https://api.tomorrow.io/v4/weather/forecast', {
                params: {
                    location: `${coordinates.lat},${coordinates.lng}`,
                    apikey: weatherApiKey,
                    timesteps: 'daily',
                    startTime: travelDates.startDate,
                    endTime: travelDates.endDate
                }
            }
        );

        const data = response.data;
        return {
            forecast: 'clear',
            hasStorms: false,
            heavyRain: false,
            strongWinds: false,
            extremeTemperature: false
        };
    } catch (error) {
        console.error('Weather API error:', error.message);
        return getMockWeatherData();
    }
};

exports.getCrimeData = async (startCoords, endCoords) => {
    try {
        const crimeApiKey = process.env.CRIME_API_KEY;
        
        if (!crimeApiKey) {
            return getMockCrimeData();
        }

        // CrimeoMeter API call would go here
        return {
            crimeRate: Math.random() * 0.5,
            isHighCrimeArea: false,
            hasRecentIncidents: Math.random() > 0.7,
            incidentTypes: []
        };
    } catch (error) {
        console.error('Crime API error:', error.message);
        return getMockCrimeData();
    }
};

exports.calculateDistance = async (origin, destination, travelMode) => {
    try {
        const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
        
        if (!googleMapsApiKey) {
            return getMockDistanceData();
        }

        const response = await axios.get(
            'https://maps.googleapis.com/maps/api/directions/json', {
                params: {
                    origin,
                    destination,
                    mode: travelMode,
                    key: googleMapsApiKey
                }
            }
        );

        const route = response.data.routes;
        if (!route) throw new Error('No route found');

        const leg = route.legs;
        return {
            distance: leg.distance.text,
            duration: leg.duration.text,
            hasTrafficIssues: false,
            roadCondition: 'good'
        };
    } catch (error) {
        console.error('Distance calculation error:', error.message);
        return getMockDistanceData();
    }
};

// Mock data functions
function getMockWeatherData() {
    return {
        forecast: 'clear',
        hasStorms: false,
        heavyRain: false,
        strongWinds: false,
        extremeTemperature: false
    };
}

function getMockCrimeData() {
    return {
        crimeRate: Math.random() * 0.4,
        isHighCrimeArea: false,
        hasRecentIncidents: Math.random() > 0.8,
        incidentTypes: []
    };
}

function getMockDistanceData() {
    return {
        distance: `${Math.floor(Math.random() * 300 + 50)} km`,
        duration: `${Math.floor(Math.random() * 8 + 1)}h ${Math.floor(Math.random() * 60)}m`,
        hasTrafficIssues: Math.random() > 0.8,
        roadCondition: 'good'
    };
}
