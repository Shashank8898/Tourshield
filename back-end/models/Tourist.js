const mongoose = require('mongoose');

const touristSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true },
    medicalConditions: { type: String },
    contactNumber: { type: String, required: true },
    bloodGroup: { type: String },
})

module.exports = mongoose.model('Tourist', touristSchema);