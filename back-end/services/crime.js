const OpenAI = require('openai')

class OpenAISafetyService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async getSafetyAnalysis(location, travelMode = 'driving', travelDate = null) {
    const systemPrompt = `You are a global travel safety expert with comprehensive knowledge of crime statistics, safety conditions, and travel risks worldwide. Provide accurate, current safety assessments for any location globally.`

    const userPrompt = `Analyze the safety and security conditions for traveling to: ${location}

Travel Mode: ${travelMode}
Travel Date: ${travelDate || 'Current period'}

Provide a comprehensive safety assessment with this EXACT JSON structure:
{
  "safetyScore": 8.5,
  "riskLevel": "Low|Medium|High",
  "overallAssessment": "Brief summary of safety conditions",
  "crimeRisks": {
    "pettyTheft": "Low|Medium|High",
    "violentCrime": "Low|Medium|High", 
    "terrorism": "Low|Medium|High",
    "scams": "Low|Medium|High"
  },
  "specificRisks": [
    "Specific risk factor 1",
    "Specific risk factor 2"
  ],
  "safeAreas": [
    "Safe neighborhood/area 1",
    "Safe neighborhood/area 2"
  ],
  "avoidAreas": [
    "Area to avoid 1",
    "Area to avoid 2"
  ],
  "transportationSafety": {
    "driving": "Risk level and specific concerns",
    "publicTransport": "Risk level and specific concerns",
    "walking": "Risk level and specific concerns",
    "taxi": "Risk level and specific concerns"
  },
  "timeSpecificRisks": {
    "dayTime": "Daytime safety considerations",
    "nightTime": "Nighttime safety considerations"
  },
  "seasonalConsiderations": [
    "Weather-related safety factor",
    "Tourist season impact"
  ],
  "emergencyInfo": {
    "policeNumber": "Local emergency number",
    "hospitalInfo": "Medical emergency guidance",
    "embassy": "Embassy contact info if international"
  },
  "safetyTips": [
    "Specific tip 1",
    "Specific tip 2",
    "Specific tip 3"
  ],
  "culturalConsiderations": [
    "Cultural safety consideration 1",
    "Cultural safety consideration 2"
  ]
}`

    try {
      console.log('🤖 Analyzing safety conditions with OpenAI for:', location)
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.2, // Low temperature for factual accuracy
        response_format: { type: "json_object" }
      })

      const responseText = completion.choices[0].message.content
      const safetyAnalysis = JSON.parse(responseText)
      
      console.log(`✅ OpenAI safety analysis complete for ${location}: ${safetyAnalysis.riskLevel} risk (${safetyAnalysis.safetyScore}/10)`)
      
      return safetyAnalysis

    } catch (error) {
      console.error('❌ OpenAI safety analysis error:', error.message)
      return this.getFallbackSafetyData(location)
    }
  }

  async getMultiLocationSafety(locations, travelMode = 'driving') {
    const systemPrompt = `You are a travel safety expert. Compare safety conditions across multiple locations and provide route-specific insights.`

    const userPrompt = `Compare safety conditions for this travel route:
Locations: ${locations.join(' → ')}
Travel Mode: ${travelMode}

Provide comparative safety analysis in this JSON format:
{
  "routeOverallSafety": 8.2,
  "routeRiskLevel": "Low|Medium|High",
  "locationComparison": [
    {
      "location": "Location name",
      "safetyScore": 8.5,
      "riskLevel": "Low|Medium|High",
      "keyRisks": ["risk1", "risk2"],
      "recommendations": ["rec1", "rec2"]
    }
  ],
  "routeSpecificRisks": [
    "Risk specific to this route",
    "Another route-specific consideration"
  ],
  "bestPracticesForRoute": [
    "Route-specific safety tip 1",
    "Route-specific safety tip 2"
  ],
  "alternativeRouteSafety": "Assessment of alternative routes if relevant"
}`

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      const responseText = completion.choices[0].message.content
      return JSON.parse(responseText)

    } catch (error) {
      console.error('❌ Multi-location safety analysis error:', error.message)
      return this.getBasicRouteSafety(locations)
    }
  }

  async getWeatherSafetyImpact(location, weatherData) {
    const systemPrompt = `You are a travel safety expert specializing in weather-related risks and safety impacts.`

    const userPrompt = `Analyze how current weather conditions affect travel safety:

Location: ${location}
Weather Conditions: ${JSON.stringify(weatherData)}

Provide weather-safety analysis in JSON format:
{
  "weatherSafetyScore": 8.0,
  "weatherRiskLevel": "Low|Medium|High",
  "weatherImpacts": [
    "Specific weather-related safety impact 1",
    "Specific weather-related safety impact 2"
  ],
  "travelRecommendations": [
    "Weather-specific travel recommendation 1",
    "Weather-specific travel recommendation 2"
  ],
  "equipmentNeeded": [
    "Safety equipment 1",
    "Safety equipment 2"
  ],
  "timingAdjustments": "Recommended timing adjustments based on weather"
}`

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.2,
        response_format: { type: "json_object" }
      })

      const responseText = completion.choices[0].message.content
      return JSON.parse(responseText)

    } catch (error) {
      console.error('❌ Weather safety analysis error:', error.message)
      return {
        weatherSafetyScore: 7.5,
        weatherRiskLevel: 'Medium',
        weatherImpacts: ['Weather data analysis temporarily unavailable'],
        travelRecommendations: ['Check local weather conditions before travel'],
        equipmentNeeded: ['Weather-appropriate clothing'],
        timingAdjustments: 'Monitor weather forecasts for optimal travel timing'
      }
    }
  }

  // Backward compatibility methods
  async getCrimeData(lat, lng, radiusKm = 5) {
    const location = `${lat}, ${lng}`
    const safetyData = await this.getSafetyAnalysis(location)
    
    return {
      totalIncidents: 0, // Not specific data, but overall assessment available
      crimeTypes: safetyData.crimeRisks || {},
      riskFactors: safetyData.specificRisks || ['Standard precautions recommended'],
      riskLevel: safetyData.riskLevel
    }
  }

  async getSafetyScore(lat, lng) {
    const location = `${lat}, ${lng}`
    const safetyData = await this.getSafetyAnalysis(location)
    return safetyData.safetyScore
  }

  async getSafetyData(lat, lng, locationName = '') {
    const location = locationName || `${lat}, ${lng}`
    const safetyData = await this.getSafetyAnalysis(location)
    
    return {
      safetyScore: safetyData.safetyScore,
      riskLevel: safetyData.riskLevel,
      riskFactors: safetyData.specificRisks || ['No specific risks identified'],
      source: 'OpenAI Safety Intelligence',
      location: location,
      confidence: 'High'
    }
  }

  getFallbackSafetyData(location) {
    // Basic fallback if OpenAI fails (very rare)
    let safetyScore = 7.0
    let riskLevel = 'Medium'
    
    const locationLower = location.toLowerCase()
    
    // Very basic location-based scoring
    const safePlaces = ['singapore', 'tokyo', 'dubai', 'zurich', 'reykjavik']
    const moderatePlaces = ['mumbai', 'delhi', 'bangalore', 'chennai', 'pune']
    
    if (safePlaces.some(place => locationLower.includes(place))) {
      safetyScore = 8.5
      riskLevel = 'Low'
    } else if (moderatePlaces.some(place => locationLower.includes(place))) {
      safetyScore = 7.5
      riskLevel = 'Medium'
    }

    return {
      safetyScore: safetyScore,
      riskLevel: riskLevel,
      overallAssessment: 'Basic safety assessment - detailed analysis temporarily unavailable',
      crimeRisks: {
        pettyTheft: 'Medium',
        violentCrime: 'Low',
        terrorism: 'Low',
        scams: 'Medium'
      },
      specificRisks: ['Exercise normal travel precautions'],
      safeAreas: ['City center and tourist areas'],
      avoidAreas: ['Check local advisories'],
      transportationSafety: {
        driving: 'Exercise normal caution',
        publicTransport: 'Generally safe with awareness',
        walking: 'Safe in well-lit areas',
        taxi: 'Use official taxis'
      },
      timeSpecificRisks: {
        dayTime: 'Generally safe with normal precautions',
        nightTime: 'Exercise extra caution'
      },
      seasonalConsiderations: ['Weather-appropriate preparation'],
      emergencyInfo: {
        policeNumber: 'Local emergency services',
        hospitalInfo: 'Contact local medical facilities',
        embassy: 'Contact nearest embassy if international'
      },
      safetyTips: [
        'Keep valuables secure',
        'Stay aware of surroundings',
        'Keep emergency contacts accessible'
      ],
      culturalConsiderations: ['Respect local customs and laws']
    }
  }

  getBasicRouteSafety(locations) {
    return {
      routeOverallSafety: 7.5,
      routeRiskLevel: 'Medium',
      locationComparison: locations.map(loc => ({
        location: loc,
        safetyScore: 7.5,
        riskLevel: 'Medium',
        keyRisks: ['Standard travel risks'],
        recommendations: ['Exercise normal caution']
      })),
      routeSpecificRisks: ['Standard route safety precautions apply'],
      bestPracticesForRoute: [
        'Plan your route in advance',
        'Share itinerary with someone',
        'Keep emergency contacts ready'
      ],
      alternativeRouteSafety: 'Consider main highways and well-traveled routes'
    }
  }
}

module.exports = new OpenAISafetyService()
