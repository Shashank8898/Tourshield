const mongoose = require('mongoose');

const routeSegmentSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    distance: { type: String, required: true },
    duration: { type: String, required: true },
    safetyScore: { type: Number, required: true, min: 0, max: 10 },
    riskFactors: [{ type: String }],
    recommendations: [{ type: String }],
    coordinates: {
        start: { lat: Number, lng: Number },
        end: { lat: Number, lng: Number }
    }
});

const routeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    origin: { type: String, required: true },
    destinations: [{ type: String, required: true }],
    travelMode: { 
        type: String, 
        enum: ['driving', 'transit', 'train', 'flying'], 
        required: true 
    },
    travelDates: {
        startDate: Date,
        endDate: Date
    },
    preferences: {
        budget: { type: String, enum: ['budget', 'moderate', 'luxury'], default: 'moderate' },
        interests: [String],
        safetyPriority: { type: String, enum: ['low', 'medium', 'high'], default: 'high' }
    },
    analysis: {
        overallSafetyScore: { type: Number, required: true, min: 0, max: 10 },
        totalDistance: String,
        estimatedDuration: String,
        riskAssessment: {
            weatherRisk: { type: String, enum: ['Low', 'Medium', 'High'] },
            crimeRisk: { type: String, enum: ['Low', 'Medium', 'High'] },
            trafficRisk: { type: String, enum: ['Low', 'Medium', 'High'] },
            naturalDisasterRisk: { type: String, enum: ['Low', 'Medium', 'High'] }
        },
        routeSegments: [routeSegmentSchema],
        emergencyContacts: [{ name: String, number: String }],
        aiInsights: [String]
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Route', routeSchema);
