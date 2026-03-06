const OpenAI = require('openai')

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async analyzeRoute(routeData) {
    const systemPrompt = `You are TourShield AI, an expert travel safety and routing assistant. You provide intelligent route analysis, safety assessments, and personalized travel recommendations.

ALWAYS respond with valid JSON only. No explanations, no markdown, no code blocks. Pure JSON.`

    const userPrompt = `Analyze this travel request and provide comprehensive recommendations:

TRAVEL REQUEST:
- Origin: ${routeData.origin}
- Destinations: ${routeData.destinations.join(', ')}
- Preferred Travel Mode: ${routeData.travelMode}
- Budget Level: ${routeData.preferences.budget}
- Interests: ${routeData.preferences.interests.join(', ') || 'General travel'}
- Safety Priority: ${routeData.preferences.safetyPriority}
- Travel Dates: ${routeData.travelDates.startDate} ${routeData.travelDates.endDate ? 'to ' + routeData.travelDates.endDate : '(single date)'}

Respond with this exact JSON structure:
{
  "routeFeasibility": {
    "isDirect": boolean,
    "recommendedMode": "driving|flying|train|bus|multi-modal",
    "reason": "Clear explanation of why this mode is recommended",
    "alternatives": ["alternative1", "alternative2"],
    "complexity": "Low|Medium|High"
  },
  "transportationPlan": [
    {
      "segment": "origin to destination description",
      "mode": "flight|driving|train|bus",
      "estimatedDuration": "X hours Y minutes",
      "estimatedDistance": "X km",
      "safetyScore": 8.5,
      "considerations": ["important factor 1", "important factor 2"]
    }
  ],
  "safetyAssessment": {
    "overallRisk": "Low|Medium|High",
    "riskFactors": ["specific risk 1", "specific risk 2"],
    "safetyScore": 8.5,
    "recommendations": ["safety tip 1", "safety tip 2", "safety tip 3"]
  },
  "budgetAnalysis": {
    "estimatedCost": "₹X,XXX - ₹Y,YYY",
    "costBreakdown": {
      "transportation": "₹X,XXX",
      "accommodation": "₹X,XXX", 
      "food": "₹X,XXX",
      "activities": "₹X,XXX"
    },
    "budgetTips": ["tip 1", "tip 2", "tip 3"]
  },
  "weatherConsiderations": {
    "seasonalFactors": ["factor 1", "factor 2"],
    "packingRecommendations": ["item 1", "item 2"],
    "bestTravelTimes": "timing recommendation"
  },
  "personalizedInsights": [
    "insight based on interests and preferences",
    "practical travel tip",
    "experience enhancement suggestion"
  ],
  "emergencyPreparation": {
    "documentsNeeded": ["document 1", "document 2"],
    "emergencyTips": ["tip 1", "tip 2"],
    "importantContacts": ["contact type 1", "contact type 2"]
  }
}`

    try {
      console.log('🤖 Requesting OpenAI GPT-3.5-turbo analysis...')
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent responses
        response_format: { type: "json_object" }
      })

      const responseText = completion.choices[0].message.content
      console.log('📥 OpenAI response received, length:', responseText.length)
      
      const aiAnalysis = JSON.parse(responseText)
      console.log('✅ OpenAI analysis parsed successfully')
      
      return aiAnalysis
      
    } catch (error) {
      console.error('❌ OpenAI analysis error:', error.message)
      console.log('🔄 Using fallback analysis...')
      return this.getFallbackAnalysis(routeData)
    }
  }

  async generateDetailedRecommendations(routeData, realTimeData) {
    const systemPrompt = `You are a travel expert providing detailed, actionable recommendations. Respond with valid JSON only.`
    
    const userPrompt = `Based on this route analysis and current conditions, provide specific recommendations:

ROUTE ANALYSIS: ${JSON.stringify(routeData, null, 2)}
REAL-TIME CONDITIONS: ${JSON.stringify(realTimeData, null, 2)}

Respond with this JSON structure:
{
  "immediateActions": ["actionable step 1", "actionable step 2"],
  "safetyPrecautions": ["specific precaution 1", "specific precaution 2"],
  "packingEssentials": ["essential item 1", "essential item 2"],
  "timingAdvice": "specific timing recommendation",
  "alternativeOptions": ["practical alternative 1", "practical alternative 2"],
  "localTips": ["local insight 1", "local insight 2"],
  "contingencyPlans": ["backup plan 1", "backup plan 2"]
}`

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.4,
        response_format: { type: "json_object" }
      })

      const responseText = completion.choices[0].message.content
      return JSON.parse(responseText)
      
    } catch (error) {
      console.error('❌ OpenAI recommendations error:', error.message)
      return this.getFallbackRecommendations()
    }
  }

  async assessLocationSafety(location, travelMode, crimeData, weatherData) {
    const systemPrompt = `You are a travel safety expert. Analyze location safety and provide specific assessments. Respond with valid JSON only.`
    
    const userPrompt = `Assess the safety of traveling to ${location} via ${travelMode}:

CRIME DATA: ${JSON.stringify(crimeData)}
WEATHER DATA: ${JSON.stringify(weatherData)}

Respond with this JSON structure:
{
  "safetyScore": 8.5,
  "riskLevel": "Low|Medium|High",
  "primaryRisks": ["specific risk 1", "specific risk 2"],
  "mitigationStrategies": ["strategy 1", "strategy 2"],
  "bestPractices": ["practice 1", "practice 2"],
  "timeSpecificAdvice": {
    "dayTime": "specific day advice",
    "nightTime": "specific night advice"
  },
  "emergencyGuidance": ["guidance 1", "guidance 2"]
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
      console.error('❌ OpenAI safety assessment error:', error.message)
      return {
        safetyScore: 7.5,
        riskLevel: 'Medium',
        primaryRisks: ['Standard travel risks apply'],
        mitigationStrategies: ['Exercise normal precautions'],
        bestPractices: ['Stay alert', 'Keep valuables secure'],
        timeSpecificAdvice: {
          dayTime: 'Generally safer during daylight hours',
          nightTime: 'Exercise extra caution after dark'
        },
        emergencyGuidance: ['Keep emergency contacts accessible']
      }
    }
  }

  async generatePersonalizedInsights(userPreferences, routeAnalysis) {
    const systemPrompt = `You are a personalized travel advisor. Create customized insights based on user preferences and route analysis. Respond with valid JSON only.`
    
    const userPrompt = `Create personalized travel insights:

USER PREFERENCES: ${JSON.stringify(userPreferences, null, 2)}
ROUTE ANALYSIS: ${JSON.stringify(routeAnalysis, null, 2)}

Respond with this JSON structure:
{
  "personalizedTips": ["tip based on user interests", "tip based on budget", "tip based on safety preference"],
  "experienceEnhancers": ["experience suggestion 1", "experience suggestion 2"],
  "budgetOptimizations": ["money-saving tip 1", "money-saving tip 2"],
  "interestBasedRecommendations": ["recommendation 1", "recommendation 2"],
  "safetyPersonalization": ["personalized safety tip"],
  "travelStyleAdvice": "advice tailored to user's travel style and preferences"
}`

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.5,
        response_format: { type: "json_object" }
      })

      const responseText = completion.choices[0].message.content
      return JSON.parse(responseText)
      
    } catch (error) {
      console.error('❌ OpenAI personalized insights error:', error.message)
      return {
        personalizedTips: ['Plan your journey in advance', 'Keep important documents safe'],
        experienceEnhancers: ['Try local cuisine', 'Connect with locals'],
        budgetOptimizations: ['Book in advance for better rates', 'Consider off-peak travel'],
        interestBasedRecommendations: ['Visit attractions that match your interests'],
        safetyPersonalization: ['Stay aware of your surroundings'],
        travelStyleAdvice: 'Travel at your own pace and enjoy the experience'
      }
    }
  }

  getFallbackAnalysis(routeData) {
    const isInternational = this.detectInternationalRoute(routeData.origin, routeData.destinations[0])
    const isLongDistance = this.detectLongDistance(routeData.origin, routeData.destinations[0])
    
    return {
      routeFeasibility: {
        isDirect: !isInternational,
        recommendedMode: isInternational ? 'flying' : 
                         isLongDistance ? 'flying' : 
                         routeData.travelMode || 'driving',
        reason: isInternational ? 
          'International travel requires flight for efficiency and practicality' :
          isLongDistance ?
          'Long distance travel is more efficient by air' :
          'Direct route available via ground transportation',
        alternatives: isInternational ? ['connecting flights', 'multi-stop flights'] : 
                     isLongDistance ? ['train', 'bus'] : ['alternate routes'],
        complexity: isInternational ? 'High' : isLongDistance ? 'Medium' : 'Low'
      },
      transportationPlan: [{
        segment: `${routeData.origin} to ${routeData.destinations[0]}`,
        mode: isInternational ? 'flight' : isLongDistance ? 'flight' : routeData.travelMode || 'driving',
        estimatedDuration: isInternational ? '6-12 hours' : isLongDistance ? '2-6 hours' : '1-8 hours',
        estimatedDistance: isInternational ? '2000+ km' : isLongDistance ? '500-2000 km' : '50-500 km',
        safetyScore: isInternational ? 9.0 : 8.0,
        considerations: isInternational ? 
          ['Passport required', 'Visa may be required', 'International travel insurance recommended'] :
          ['Check travel documents', 'Monitor weather conditions', 'Plan rest stops']
      }],
      safetyAssessment: {
        overallRisk: 'Medium',
        riskFactors: ['Standard travel risks', 'Distance-related fatigue'],
        safetyScore: 8.0,
        recommendations: [
          'Keep emergency contacts readily available',
          'Inform someone of your travel plans',
          'Carry sufficient funds for emergencies'
        ]
      },
      budgetAnalysis: {
        estimatedCost: this.estimateCostByBudget(routeData.preferences.budget, isInternational),
        costBreakdown: {
          transportation: isInternational ? '₹35,000' : isLongDistance ? '₹8,000' : '₹3,000',
          accommodation: isInternational ? '₹15,000' : '₹5,000',
          food: isInternational ? '₹10,000' : '₹3,000',
          activities: isInternational ? '₹12,000' : '₹4,000'
        },
        budgetTips: [
          'Book transportation in advance for better rates',
          'Compare prices across different platforms',
          'Consider travel insurance for international trips'
        ]
      },
      weatherConsiderations: {
        seasonalFactors: ['Check seasonal weather patterns at destination'],
        packingRecommendations: ['Weather-appropriate clothing', 'Rain protection if needed'],
        bestTravelTimes: 'Avoid extreme weather seasons for optimal travel experience'
      },
      personalizedInsights: [
        `Journey from ${routeData.origin} to ${routeData.destinations[0]} planned`,
        `Budget preference: ${routeData.preferences.budget}`,
        'AI analysis provides comprehensive travel recommendations'
      ],
      emergencyPreparation: {
        documentsNeeded: isInternational ? ['Passport', 'Visa (if required)', 'Travel insurance'] : ['Valid ID', 'Emergency contacts'],
        emergencyTips: ['Keep copies of important documents', 'Have emergency fund available'],
        importantContacts: ['Local emergency services', 'Embassy (for international travel)']
      }
    }
  }

  detectInternationalRoute(origin, destination) {
    const internationalKeywords = [
      'japan', 'tokyo', 'usa', 'america', 'new york', 'los angeles',
      'uk', 'london', 'england', 'paris', 'france', 'germany', 'berlin',
      'china', 'beijing', 'shanghai', 'singapore', 'dubai', 'uae',
      'thailand', 'bangkok', 'australia', 'sydney', 'canada', 'toronto',
      'italy', 'rome', 'spain', 'madrid', 'russia', 'moscow',
      'south korea', 'seoul', 'malaysia', 'kuala lumpur'
    ]
    
    const originLower = origin.toLowerCase()
    const destLower = destination.toLowerCase()
    
    // Check if destination contains international keywords
    const destIsInternational = internationalKeywords.some(keyword => destLower.includes(keyword))
    // Check if origin and destination are in different countries
    const differentCountries = !this.areSameCountry(originLower, destLower)
    
    return destIsInternational || differentCountries
  }

  detectLongDistance(origin, destination) {
    const longDistancePairs = [
      ['delhi', 'mumbai'], ['mumbai', 'bangalore'], ['delhi', 'bangalore'],
      ['delhi', 'chennai'], ['mumbai', 'chennai'], ['delhi', 'kolkata'],
      ['mumbai', 'kolkata'], ['bangalore', 'chennai'], ['pune', 'delhi'],
      ['hyderabad', 'mumbai'], ['ahmedabad', 'delhi']
    ]
    
    const originLower = origin.toLowerCase()
    const destLower = destination.toLowerCase()
    
    return longDistancePairs.some(([city1, city2]) => 
      (originLower.includes(city1) && destLower.includes(city2)) ||
      (originLower.includes(city2) && destLower.includes(city1))
    )
  }

  areSameCountry(origin, destination) {
    const indianCities = [
      'delhi', 'mumbai', 'bangalore', 'chennai', 'kolkata', 'hyderabad',
      'pune', 'ahmedabad', 'jaipur', 'lucknow', 'kanpur', 'nagpur',
      'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna',
      'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik'
    ]
    
    const originIsIndian = indianCities.some(city => origin.includes(city))
    const destIsIndian = indianCities.some(city => destination.includes(city))
    
    return originIsIndian && destIsIndian
  }

  estimateCostByBudget(budget, isInternational) {
    if (isInternational) {
      switch (budget) {
        case 'budget': return '₹40,000 - ₹70,000'
        case 'moderate': return '₹70,000 - ₹120,000'  
        case 'luxury': return '₹120,000 - ₹200,000+'
        default: return '₹70,000 - ₹120,000'
      }
    } else {
      switch (budget) {
        case 'budget': return '₹5,000 - ₹15,000'
        case 'moderate': return '₹15,000 - ₹35,000'
        case 'luxury': return '₹35,000 - ₹80,000'
        default: return '₹15,000 - ₹35,000'
      }
    }
  }

  getFallbackRecommendations() {
    return {
      immediateActions: ['Verify all travel documents', 'Check weather forecasts'],
      safetyPrecautions: ['Keep valuables secure', 'Stay aware of surroundings'],
      packingEssentials: ['Emergency contacts list', 'Basic first aid supplies'],
      timingAdvice: 'Plan to travel during daylight hours for added safety',
      alternativeOptions: ['Consider backup transportation methods', 'Have flexible bookings when possible'],
      localTips: ['Research local customs and laws', 'Learn basic local phrases if traveling internationally'],
      contingencyPlans: ['Maintain emergency fund', 'Keep important phone numbers accessible']
    }
  }
}

module.exports = new OpenAIService()
