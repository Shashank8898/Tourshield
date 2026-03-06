const axios = require('axios')

class WeatherService {
  constructor() {
    this.apiKey = process.env.WEATHER_API_KEY
    this.baseUrl = 'https://api.tomorrow.io/v4'
  }

  async getCurrentWeather(lat, lng) {
    try {
      const params = {
        location: `${lat},${lng}`,
        apikey: this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/weather/realtime`, { params })
      
      return this.parseWeatherResponse(response.data)
    } catch (error) {
      console.error('Weather API error:', error.message)
      // Return fallback data if API fails
      return {
        temperature: 'N/A',
        condition: 'Unknown',
        humidity: 'N/A',
        windSpeed: 'N/A',
        visibility: 'Good'
      }
    }
  }

  async getWeatherForecast(lat, lng, days = 7) {
    try {
      const params = {
        location: `${lat},${lng}`,
        timesteps: 'daily',
        units: 'metric',
        fields: 'temperature,weatherCode,precipitationProbability,windSpeed,humidity',
        startTime: 'now',
        endTime: 'nowPlus7d',
        apikey: this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/timelines`, { params })
      
      return response.data.data.timelines[0].intervals.map(interval => ({
        date: interval.startTime.split('T')[0],
        temperature: `${Math.round(interval.values.temperature)}°C`,
        condition: this.getWeatherCondition(interval.values.weatherCode),
        precipitationChance: `${interval.values.precipitationProbability}%`
      }))
    } catch (error) {
      console.error('Weather forecast error:', error.message)
      return []
    }
  }

  parseWeatherResponse(data) {
    const values = data.data.values
    
    return {
      temperature: `${Math.round(values.temperature)}°C`,
      condition: this.getWeatherCondition(values.weatherCode),
      humidity: `${values.humidity}%`,
      windSpeed: `${Math.round(values.windSpeed)} km/h`,
      visibility: values.visibility > 10 ? 'Excellent' : values.visibility > 5 ? 'Good' : 'Poor'
    }
  }

  getWeatherCondition(code) {
    const conditions = {
      1000: 'Clear',
      1100: 'Mostly Clear',
      1101: 'Partly Cloudy',
      1102: 'Mostly Cloudy',
      1001: 'Cloudy',
      2000: 'Fog',
      4000: 'Drizzle',
      4001: 'Rain',
      4200: 'Light Rain',
      4201: 'Heavy Rain',
      5000: 'Snow',
      5001: 'Flurries',
      5100: 'Light Snow',
      5101: 'Heavy Snow',
      6000: 'Freezing Drizzle',
      6001: 'Freezing Rain',
      6200: 'Light Freezing Rain',
      6201: 'Heavy Freezing Rain',
      7000: 'Ice Pellets',
      7101: 'Heavy Ice Pellets',
      7102: 'Light Ice Pellets',
      8000: 'Thunderstorm'
    }
    
    return conditions[code] || 'Unknown'
  }
}

module.exports = new WeatherService()
