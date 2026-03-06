const googleMapsService = require('../services/googleMaps')
const weatherService = require('../services/weather')
const crimeService = require('../services/crime') // This should now be your OpenAI safety service
const emergencyService = require('../services/emergency')
const openaiService = require('../services/openaiService')

const {Blockchain, Transaction} = require("../services/blockchain/blockchain.js");
const {generateKeyPair, signData} = require("../services/blockchain/cryptoUtils.js");


//Save Toursist BlockChain Function 
exports.saveTourist = async (req, res) => {
    try{
        const { fullName, dateOfBirth,nationality, medicalConditions, contactNumber, bloodGroup,destinationTo,
          destinationFrom, tripId, startingDate, endingDate
         } = req.body;

        // Generate issuer keys
        const { publicKey, privateKey } = generateKeyPair();
        
        // Create blockchain
        const tourChain = new Blockchain();
        
        const dataFingerprint = 'sha256hashofTouristData'; // In production, hash actual data
        const signature = signData(privateKey, dataFingerprint);

        const txVeronica = new Transaction(
            'did:tourshield:Veronica-8891',
            dataFingerprint,
            publicKey,
            signature,
            { FullName:fullName, DateOfBirth:dateOfBirth,Nationality:nationality, MedicalConditions:medicalConditions, ContactNumber:contactNumber, BloodGroup:bloodGroup },
            { TripId: tripId, DestinationTo: destinationTo,DestinationFrom: destinationFrom,StartingDate: startingDate, EndingDate:endingDate  }
        )

        
        // Add and mine transaction
        tourChain.addTransaction(txVeronica);
        tourChain.minePendingTransactions();
        console.log(JSON.stringify(tourChain, null, 2));


        res.status(201).json({ success: true});
    } catch (error) {
        console.error('Save route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save route'
        });
    }
}

exports.analyzeRoute = async (req, res) => {
  try {
    const { origin, destinations, travelMode, preferences, travelDates } = req.body
    
    console.log('🤖 Starting OpenAI-powered route analysis...')
    console.log('From:', origin, 'To:', destinations)

    // Validate input
    if (!origin || !destinations || destinations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid origin and destination locations'
      })
    }

    // Step 1: Get OpenAI analysis
    const routeRequest = {
      origin,
      destinations,
      travelMode: travelMode || 'driving',
      preferences: preferences || { budget: 'moderate', interests: [], safetyPriority: 'high' },
      travelDates: travelDates || { startDate: new Date().toISOString().split('T')[0] }
    }

    let aiAnalysis
    try {
      aiAnalysis = await openaiService.analyzeRoute(routeRequest)
      console.log('✅ OpenAI analysis completed successfully')
    } catch (aiError) {
      console.error('⚠️ OpenAI analysis failed, using fallback:', aiError.message)
      aiAnalysis = openaiService.getFallbackAnalysis(routeRequest)
    }

    // Step 2: Get real-world data based on AI recommendations
    let realWorldData = {}
    
    try {
      // Get actual data if AI recommends ground transport
      const hasGroundTransport = aiAnalysis.transportationPlan.some(
        segment => ['driving', 'train', 'bus'].includes(segment.mode)
      )
      
      if (hasGroundTransport && aiAnalysis.routeFeasibility.isDirect) {
        try {
          const directions = await googleMapsService.getDirections(
            origin, 
            destinations[0], 
            [], 
            travelMode || 'driving'
          )
          realWorldData.directions = directions
          console.log('✅ Got real directions from Google Maps')
        } catch (error) {
          console.log('⚠️ Could not get directions, using AI estimates')
        }
      }

      // Get weather data for key locations
      try {
        const originCoords = await googleMapsService.geocodeAddress(origin)
        const destCoords = await googleMapsService.geocodeAddress(destinations[0])
        
        const [originWeather, destWeather] = await Promise.all([
          weatherService.getCurrentWeather(originCoords.lat, originCoords.lng),
          weatherService.getCurrentWeather(destCoords.lat, destCoords.lng)
        ])
        
        realWorldData.originWeather = originWeather
        realWorldData.destWeather = destWeather
        
        console.log('✅ Got real-world weather data')
        
      } catch (error) {
        console.log('⚠️ Could not get weather data:', error.message)
      }

      // Get comprehensive OpenAI safety analysis for origin and destination
      try {
        const [originSafety, destSafety] = await Promise.all([
          crimeService.getSafetyAnalysis(origin, travelMode, routeRequest.travelDates.startDate),
          crimeService.getSafetyAnalysis(destinations[0], travelMode, routeRequest.travelDates.startDate)
        ])
        
        // Get route-specific safety analysis
        const routeSafety = await crimeService.getMultiLocationSafety(
          [origin, ...destinations], 
          travelMode
        )
        
        // Get weather-safety correlation if weather data is available
        let weatherSafetyData = null
        if (realWorldData.originWeather) {
          weatherSafetyData = await crimeService.getWeatherSafetyImpact(
            origin,
            realWorldData.originWeather
          )
        }
        
        realWorldData.originSafety = originSafety
        realWorldData.destSafety = destSafety
        realWorldData.routeSafety = routeSafety
        realWorldData.weatherSafety = weatherSafetyData
        
        console.log('✅ Got comprehensive OpenAI safety analysis')
        
      } catch (error) {
        console.log('⚠️ Using basic safety analysis:', error.message)
        // Fallback to basic safety data
        realWorldData.originSafety = await crimeService.getSafetyData(0, 0, origin)
        realWorldData.destSafety = await crimeService.getSafetyData(0, 0, destinations[0])
      }

    } catch (error) {
      console.log('⚠️ Using OpenAI analysis with limited real-world data')
    }

    // Step 3: Get detailed AI recommendations based on real data
    const detailedRecommendations = await openaiService.generateDetailedRecommendations(aiAnalysis, realWorldData)

    // Step 4: AI-powered safety assessments for each segment
    const enhancedSegments = []
    for (const segment of aiAnalysis.transportationPlan) {
      console.log(`🔍 Analyzing segment: ${segment.segment}`)
      
      let segmentSafety
      try {
        // Get detailed safety analysis for this specific segment
        segmentSafety = await crimeService.getSafetyAnalysis(
          segment.segment,
          segment.mode,
          routeRequest.travelDates.startDate
        )
      } catch (error) {
        // Fallback safety data
        segmentSafety = {
          safetyScore: 7.5,
          riskLevel: 'Medium',
          specificRisks: ['Standard travel precautions recommended'],
          safetyTips: ['Stay alert', 'Keep valuables secure'],
          safeAreas: [],
          avoidAreas: [],
          emergencyInfo: {}
        }
      }

      enhancedSegments.push({
        from: segment.segment.split(' to ')[0],
        to: segment.segment.split(' to ')[1] || destinations[0],
        distance: segment.estimatedDistance,
        duration: segment.estimatedDuration,
        mode: segment.mode,
        safetyScore: segmentSafety.safetyScore,
        riskFactors: segmentSafety.specificRisks || ['No specific risks identified'],
        recommendations: segmentSafety.safetyTips || ['Exercise normal caution'],
        weather: realWorldData.originWeather || { 
          temperature: 'Check local weather',
          condition: 'Variable',
          humidity: 'N/A',
          windSpeed: 'N/A',
          visibility: 'Check conditions'
        },
        safeAreas: segmentSafety.safeAreas || [],
        avoidAreas: segmentSafety.avoidAreas || [],
        emergencyInfo: segmentSafety.emergencyInfo || {}
      })
    }

    // Step 5: Generate personalized insights
    const personalizedInsights = await openaiService.generatePersonalizedInsights(preferences, aiAnalysis)

    // Step 6: Get emergency contacts
    const emergencyContacts = emergencyService.getEmergencyContacts('IN')

    // Step 7: Build comprehensive response
    const response = {
      // Basic route info (enhanced with real data if available)
      totalDistance: realWorldData.directions?.totalDistance || 
                    aiAnalysis.transportationPlan[0]?.estimatedDistance || 'Distance unavailable',
      totalDuration: realWorldData.directions?.totalDuration || 
                    aiAnalysis.transportationPlan[0]?.estimatedDuration || 'Duration unavailable',
      overallSafetyScore: aiAnalysis.safetyAssessment.safetyScore,

      // Enhanced route segments
      routeSegments: enhancedSegments,

      // Enhanced risk assessment with OpenAI data
      riskAssessment: {
        overallRisk: realWorldData.routeSafety?.routeRiskLevel || aiAnalysis.safetyAssessment.overallRisk,
        crimeRisk: realWorldData.originSafety?.riskLevel || 'Medium',
        weatherRisk: realWorldData.weatherSafety?.weatherRiskLevel || 'Low',
        routeComplexity: aiAnalysis.routeFeasibility.complexity || 'Medium',
        recommendedMode: aiAnalysis.routeFeasibility.recommendedMode,
        specificRouteRisks: realWorldData.routeSafety?.routeSpecificRisks || []
      },

      // AI insights and recommendations
      aiInsights: [
        ...aiAnalysis.personalizedInsights,
        ...personalizedInsights.personalizedTips.slice(0, 2),
        `AI Recommendation: ${aiAnalysis.routeFeasibility.reason}`
      ],

      // Budget analysis
      budgetAnalysis: aiAnalysis.budgetAnalysis,

      // Detailed recommendations  
      detailedRecommendations: detailedRecommendations,

      // Weather considerations
      weatherConsiderations: aiAnalysis.weatherConsiderations,

      // Enhanced safety intelligence
      safetyIntelligence: {
        originSafety: realWorldData.originSafety,
        destinationSafety: realWorldData.destSafety,
        routeSpecificSafety: realWorldData.routeSafety,
        weatherSafetyImpact: realWorldData.weatherSafety
      },

      // Emergency info
      emergencyContacts: emergencyContacts,
      emergencyPreparation: aiAnalysis.emergencyPreparation,

      // Metadata
      isAIPowered: true,
      aiProvider: 'OpenAI GPT-3.5-turbo',
      analysisTimestamp: new Date().toISOString(),
      routeType: aiAnalysis.routeFeasibility.isDirect ? 'Direct route available' : 'Multi-modal route recommended',
      hasRealTimeData: Object.keys(realWorldData).length > 0,
      safetyDataSource: 'OpenAI Safety Intelligence'
    }

    console.log('🎯 OpenAI-powered analysis complete!')

    res.json({
      success: true,
      data: response,
      message: `OpenAI analysis completed. Recommended: ${aiAnalysis.routeFeasibility.recommendedMode}`,
      aiSummary: aiAnalysis.routeFeasibility.reason
    })

  } catch (error) {
    console.error('❌ OpenAI Route analysis error:', error.message)
    res.status(500).json({
      success: false,
      message: 'AI route analysis failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: 'Ensure your locations are clearly specified and try again.'
    })
  }
}

exports.saveRoute = async (req, res) => {
  try {
    const { origin, destinations, travelMode, travelDates, preferences, analysis, name } = req.body
    const userId = req.user.id

    // Import Route model if not already imported
    const Route = require('../models/Route') // Add this import at the top if missing

    const route = new Route({
      userId,
      name: name || `${origin} to ${destinations.join(', ')}`,
      origin,
      destinations,
      travelMode,
      travelDates,
      preferences,
      analysis,
      createdAt: new Date()
    })

    await route.save()
    
    console.log('✅ Route saved successfully for user:', userId)
    
    res.status(201).json({ 
      success: true, 
      data: route,
      message: 'Route saved successfully'
    })

  } catch (error) {
    console.error('❌ Save route error:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to save route',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

exports.getUserRoutes = async (req, res) => {
  try {
    const userId = req.params.userId
    
    // Verify user authorization
    if (req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to access these routes'
      })
    }

    // Import Route model if not already imported
    const Route = require('../models/Route') // Add this import at the top if missing
    
    const routes = await Route.find({ userId }).sort({ createdAt: -1 }).limit(50)
    
    console.log(`✅ Retrieved ${routes.length} routes for user:`, userId)
    
    res.json({ 
      success: true, 
      data: routes,
      count: routes.length
    })
    
  } catch (error) {
    console.error('❌ Get user routes error:', error.message)
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch routes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}
