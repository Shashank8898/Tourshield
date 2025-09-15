const Route = require('../models/Route');
const Tourist = require('../models/Tourist');
import { Blockchain, Transaction } from './blockchain.js';
import { generateKeyPair, signData } from './cryptoUtils.js';



const { getWeatherData, getCrimeData, calculateDistance } = require('../services/routeAnalysisService');

exports.analyzeRoute = async (req, res) => {
    try {
        const { origin, destinations, travelMode, travelDates, preferences } = req.body;
        
        if (!origin || !destinations || destinations.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Origin and destinations are required'
            });
        }

        // Analyze each route segment
        const routeSegments = [];
        let totalDistance = 0;
        let totalDuration = 0;
        let totalSafetyScore = 0;

        const waypoints = [origin, ...destinations.filter(d => d.trim())];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
            const from = waypoints[i];
            const to = waypoints[i + 1];
            
            // Get route data
            const routeData = await calculateDistance(from, to, travelMode);
            const crimeData = await getCrimeData(
                { lat: 0, lng: 0 }, // Would geocode in production
                { lat: 0, lng: 0 }
            );
            
            const safetyScore = calculateSafetyScore(crimeData);
            const { riskFactors, recommendations } = generateSegmentAdvice(crimeData, routeData);

            routeSegments.push({
                from,
                to,
                distance: routeData.distance,
                duration: routeData.duration,
                safetyScore,
                riskFactors,
                recommendations
            });
            
            totalDistance += parseFloat(routeData.distance.replace(/[^0-9.]/g, '')) || 100;
            totalDuration += parseFloat(routeData.duration.replace(/[^0-9.]/g, '')) || 2;
            totalSafetyScore += safetyScore;
        }

        const overallSafetyScore = parseFloat((totalSafetyScore / routeSegments.length).toFixed(1));
        
        // Get weather data
        const weatherData = await getWeatherData({ lat: 0, lng: 0 }, travelDates);
        
        // Generate insights
        const aiInsights = generateAIInsights(routeSegments, weatherData, preferences);
        
        const analysis = {
            overallSafetyScore,
            totalDistance: `${totalDistance.toFixed(0)} km`,
            estimatedDuration: `${Math.floor(totalDuration / 24)} days ${Math.floor(totalDuration % 24)} hours`,
            riskAssessment: {
                weatherRisk: weatherData.hasStorms ? 'High' : weatherData.heavyRain ? 'Medium' : 'Low',
                crimeRisk: overallSafetyScore < 6 ? 'High' : overallSafetyScore < 8 ? 'Medium' : 'Low',
                trafficRisk: routeSegments.some(s => s.riskFactors.includes('traffic')) ? 'High' : 'Medium',
                naturalDisasterRisk: 'Low'
            },
            routeSegments,
            emergencyContacts: [
                { name: 'Tourist Helpline', number: '1363' },
                { name: 'Police Control Room', number: '100' },
                { name: 'Medical Emergency', number: '108' }
            ],
            aiInsights
        };

        res.json({ success: true, data: analysis });

    } catch (error) {
        console.error('Route analysis error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to analyze route',
            error: error.message
        });
    }
};

exports.saveRoute = async (req, res) => {
    try {
        const { origin, destinations, travelMode, travelDates, name } = req.body;
        const userId = req.user.id;

        const route = new Route({
            userId,
            name: name || `${origin} to ${destinations.join(', ')}`,
            origin,
            destinations,
            travelMode,
            travelDates,
            
        });

        await route.save();
        res.status(201).json({ success: true, data: route });

    } catch (error) {
        console.error('Save route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save route'
        });
    }
};

exports.saveTourist = async (req, res) => {
    try{
        const { fullName, dateOfBirth,nationality, medicalConditions, contactNumber, bloodGroup } = req.body;

        // Generate issuer keys
        const { publicKey, privateKey } = generateKeyPair();
        
        // Create blockchain
        const tourChain = new Blockchain();
        
        const dataFingerprint = 'sha256hashofTouristData'; // In production, hash actual data
        const signature = signData(privateKey, dataFingerprint);

        const txShashank = new Transaction(
            'did:tourshield:shashank-8891',
            dataFingerprint,
            publicKey,
            signature,
            { FullName:fullName, DateOfBirth:dateOfBirth,Nationality:nationality, MedicalConditions:medicalConditions, ContactNumber:contactNumber, BloodGroup:bloodGroup },
            { tripId: 'trip-1234', destinationTo: 'Japan',destinationFrom: 'SwitzerLand', date: '2024-12-01' }
        )

        
        // Add and mine transaction
        tourChain.addTransaction(txShashank);
        tourChain.minePendingTransactions();
        console.log(JSON.stringify(tourChain, null, 2));


        await Tourist.save();
        res.status(201).json({ success: true, data: tourist });
    } catch (error) {
        console.error('Save route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save route'
        });
    }
}

exports.getUserRoutes = async (req, res) => {
    try {
        const userId = req.params.userId;
        const routes = await Route.find({ userId }).sort({ createdAt: -1 });
        res.json({ success: true, data: routes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch routes' });
    }
};

// Helper functions
function calculateSafetyScore(crimeData) {
    let baseScore = 8.5;
    if (crimeData.crimeRate > 0.5) baseScore -= 2;
    if (crimeData.isHighCrimeArea) baseScore -= 1.5;
    return Math.max(1, Math.min(10, parseFloat(baseScore.toFixed(1))));
}

function generateSegmentAdvice(crimeData, routeData) {
    const riskFactors = [];
    const recommendations = [];
    
    if (crimeData.crimeRate > 0.3) {
        riskFactors.push('Elevated crime rate in area');
        recommendations.push('Travel during daylight hours');
    }
    
    if (routeData.hasTrafficIssues) {
        riskFactors.push('Heavy traffic expected');
        recommendations.push('Avoid peak hours (8-10 AM, 6-8 PM)');
    }
    
    return { riskFactors, recommendations };
}

function generateAIInsights(routeSegments, weatherData, preferences) {
    const insights = [];
    
    const avgSafety = routeSegments.reduce((sum, s) => sum + s.safetyScore, 0) / routeSegments.length;
    
    if (avgSafety >= 8.5) {
        insights.push('Excellent route safety - well-secured areas detected');
    } else if (avgSafety < 7) {
        insights.push('Consider alternative routes for better security');
    }
    
    if (weatherData.forecast === 'clear') {
        insights.push('Perfect weather conditions for your journey');
    }
    
    if (preferences.budget === 'budget') {
        insights.push('Budget-friendly options prioritized in recommendations');
    }
    
    insights.push(`${routeSegments.length} optimized segments planned for efficient travel`);
    
    return insights;
}
