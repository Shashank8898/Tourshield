class EmergencyService {
  getEmergencyContacts(countryCode = 'IN') {
    const contacts = {
      'IN': [
        { name: 'Police Emergency', number: '100' },
        { name: 'Fire Department', number: '101' },
        { name: 'Medical Emergency', number: '108' },
        { name: 'Tourist Helpline', number: '1363' },
        { name: 'Women Helpline', number: '1091' }
      ],
      'US': [
        { name: 'Emergency Services', number: '911' },
        { name: 'Poison Control', number: '1-800-222-1222' },
        { name: 'FBI Tips', number: '1-800-CALL-FBI' }
      ],
      'UK': [
        { name: 'Emergency Services', number: '999' },
        { name: 'Non-Emergency Police', number: '101' },
        { name: 'NHS Non-Emergency', number: '111' }
      ],
      'DEFAULT': [
        { name: 'International Emergency', number: '112' },
        { name: 'Local Police', number: 'Contact local authorities' },
        { name: 'Embassy Services', number: 'Contact your embassy' }
      ]
    }

    return contacts[countryCode] || contacts['DEFAULT']
  }

  getCountryFromCoordinates(lat, lng) {
    // Simple country detection based on coordinates
    // In a real app, you'd use Google Maps Geocoding API
    if (lat >= 8.4 && lat <= 37.6 && lng >= 68.7 && lng <= 97.25) {
      return 'IN' // India
    } else if (lat >= 24.396308 && lat <= 49.384358 && lng >= -125.0 && lng <= -66.93457) {
      return 'US' // United States
    } else if (lat >= 49.959999905 && lat <= 58.6350001085 && lng >= -7.57216793459 && lng <= 1.68153079591) {
      return 'UK' // United Kingdom
    }
    
    return 'DEFAULT'
  }
}

module.exports = new EmergencyService()
