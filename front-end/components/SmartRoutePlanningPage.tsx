'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useAuth } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import jsPDF from 'jspdf'
import { 
  MapPin, Navigation, Shield, Clock, AlertTriangle, CheckCircle, Route, Zap, Eye, 
  Calendar, Users, Phone, Car, Train, Plane, Bus, ArrowRight, Plus, Minus, Download, 
  Share2, Settings, Brain, Save, Loader2
} from 'lucide-react'

// Main component for the Smart Route Planning page
export default function SmartRoutePlanningPage() {
  // Clerk authentication hooks
  const { user, isLoaded } = useUser()
  const { getToken } = useAuth()
  const router = useRouter()
  
  // State to ensure component is mounted on the client before rendering UI
  const [mounted, setMounted] = useState(false)
  // State to hold all user inputs for the route
  const [routeData, setRouteData] = useState({
    origin: '',
    destinations: [''],
    travelMode: 'driving',
    travelDates: {
      startDate: new Date().toISOString().split('T')[0], // Default to today
      endDate: ''
    },
    preferences: {
      budget: 'moderate',
      interests: [],
      safetyPriority: 'high'
    }
  })
  // State to store the analysis results from the backend
  const [routeAnalysis, setRouteAnalysis] = useState(null)
  // Loading states for asynchronous operations
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  // State for handling and displaying errors
  const [error, setError] = useState(null)
  // State to manage the active UI tab
  const [activeTab, setActiveTab] = useState('planner')
  // State for saved routes
  const [savedRoutes, setSavedRoutes] = useState([])

  // Backend API base URL
  const API_BASE = 'http://localhost:5000'

  // Effect to handle client-side mounting
  useEffect(() => {
    setMounted(true)
  }, [])

  // Effect to fetch saved routes when user loads
  useEffect(() => {
    if (user && isLoaded) {
      fetchSavedRoutes()
    }
  }, [user, isLoaded])

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in')
    }
  }, [isLoaded, user, router])

  // Fetch user's saved routes with authentication
  const fetchSavedRoutes = async () => {
    if (!user) return
    
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/api/routes/user/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSavedRoutes(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch saved routes:', error)
    }
  }

  // Generic handler for top-level input fields
  const handleInputChange = (field, value) => {
    setRouteData(prev => ({ ...prev, [field]: value }))
  }

  // Handler for nested preference fields
  const handlePreferenceChange = (field, value) => {
    setRouteData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value }
    }))
  }

  // Adds a new empty destination input field
  const addDestination = () => {
    setRouteData(prev => ({ ...prev, destinations: [...prev.destinations, ''] }))
  }

  // Removes a destination input field by its index
  const removeDestination = (index) => {
    if (routeData.destinations.length > 1) {
      setRouteData(prev => ({
        ...prev,
        destinations: prev.destinations.filter((_, i) => i !== index)
      }))
    }
  }

  // Updates the value of a specific destination input
  const updateDestination = (index, value) => {
    const newDestinations = [...routeData.destinations]
    newDestinations[index] = value
    setRouteData(prev => ({ ...prev, destinations: newDestinations }))
  }

  // Toggles an interest in the preferences
  const toggleInterest = (interest) => {
    const currentInterests = routeData.preferences.interests
    const newInterests = currentInterests.includes(interest)
      ? currentInterests.filter(i => i !== interest)
      : [...currentInterests, interest]
    handlePreferenceChange('interests', newInterests)
  }

  // Main function to call the backend for route analysis
  const analyzeRoute = async () => {
    if (!user) {
      toast.error('Please sign in to analyze routes')
      return
    }

    setError(null)
    const validDestinations = routeData.destinations.filter(d => d.trim() !== '')
    if (!routeData.origin.trim() || validDestinations.length === 0) {
      toast.error('Please provide a starting point and at least one destination.')
      return
    }

    setIsAnalyzing(true)
    setRouteAnalysis(null)
    
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/api/routes/analyze`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          ...routeData, 
          destinations: validDestinations 
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to analyze route.')
      }

      setRouteAnalysis(data.data)
      setActiveTab('analysis') // Switch to analysis tab on success
      toast.success('Route analysis complete!')
    } catch (err) {
      console.error('Analysis Error:', err)
      setError(err.message)
      toast.error(err.message)
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // Saves the currently analyzed route via the backend
  const handleSaveRoute = async () => {
    if (!user || !routeAnalysis) {
      toast.error('You must be signed in and have an analyzed route to save.')
      return
    }

    const routeName = prompt('Enter a name for this route:', `Trip to ${routeData.destinations[0]}`)
    if (!routeName) return // User cancelled

    setIsSaving(true)
    try {
      const token = await getToken()
      const response = await fetch(`${API_BASE}/api/routes/save`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...routeData,
          analysis: routeAnalysis,
          name: routeName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save route.')
      }
      
      toast.success('Route saved successfully!')
      fetchSavedRoutes() // Refresh saved routes list
    } catch (err) {
      console.error('Save Error:', err)
      toast.error(err.message)
    } finally {
      setIsSaving(false)
    }
  }
  
  // Generates and downloads a PDF summary of the route
  const handleDownloadPDF = () => {
    if (!routeAnalysis) return
    const doc = new jsPDF()
    
    doc.setFontSize(20)
    doc.text(`Route Plan: ${routeData.origin} to ${routeData.destinations[routeData.destinations.length-1]}`, 10, 20)
    
    doc.setFontSize(12)
    doc.text(`Total Distance: ${routeAnalysis.totalDistance}`, 10, 30)
    doc.text(`Estimated Duration: ${routeAnalysis.estimatedDuration}`, 10, 38)
    doc.text(`Overall Safety Score: ${routeAnalysis.overallSafetyScore}/10`, 10, 46)

    doc.setFontSize(16)
    doc.text('Route Segments', 10, 60)

    let yPos = 70
    routeAnalysis.routeSegments.forEach((seg, i) => {
      if (yPos > 280) { 
        doc.addPage()
        yPos = 20
      }
      doc.setFontSize(12)
      doc.text(`${i + 1}. ${seg.from} -> ${seg.to} (${seg.distance}) - Safety: ${seg.safetyScore}/10`, 15, yPos)
      yPos += 7
    })

    doc.save(`smart-route-plan-${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF downloaded!')
  }

  // Uses the Web Share API to share route details
  const handleShare = async () => {
    if (!routeAnalysis) {
      toast.error('Analyze a route first to share it!')
      return
    }
    const shareData = {
      title: 'My Smart Route Plan',
      text: `Check out my travel plan from ${routeData.origin} to ${routeData.destinations[0]}. Total distance: ${routeAnalysis.totalDistance}. Safety Score: ${routeAnalysis.overallSafetyScore}/10.`,
      url: window.location.href,
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
        toast.success('Route shared!')
      } else {
        await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url)
        toast.success('Route details copied to clipboard!')
      }
    } catch (err) {
      console.error('Share error:', err)
      toast.error('Could not share route.')
    }
  }

  // Data for UI elements
  const travelModes = [
    { id: 'driving', name: 'Car', icon: Car },
    { id: 'transit', name: 'Public Transport', icon: Bus },
    { id: 'train', name: 'Train', icon: Train },
    { id: 'flying', name: 'Flight', icon: Plane }
  ]

  const budgetOptions = [
    { id: 'budget', name: 'Budget Friendly', range: '₹5,000-15,000' },
    { id: 'moderate', name: 'Moderate', range: '₹15,000-35,000' },
    { id: 'luxury', name: 'Luxury', range: '₹35,000+' }
  ]

  const interestOptions = ['Historical', 'Adventure', 'Wildlife', 'Photography', 'Food', 'Spiritual', 'Beach', 'Mountains']

  // Loading spinner for initial page load
  if (!mounted || !isLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading TourShield...</p>
        </div>
      </div>
    )
  }

  // Redirect message if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-300 mb-6">Please sign in to access Smart Route Planning</p>
          <button 
            onClick={() => router.push('/sign-in')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-semibold text-white hover:shadow-lg transition-all"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Toaster 
        position="top-center" 
        reverseOrder={false} 
        toastOptions={{
          style: { 
            background: '#1a202c', 
            color: '#fff', 
            border: '1px solid #4a5568' 
          },
        }}
      />
      <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
        {/* Error Display */}
        {error && (
          <div className="fixed top-4 right-4 z-50 bg-red-500/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 hover:bg-red-600/50 rounded p-1">
              ×
            </button>
          </div>
        )}

        {/* Animated Background Elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        </div>

        <main className="relative z-10 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Page Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl lg:text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Smart Route Planning
                  </h1>
                  <p className="text-slate-300 text-base lg:text-lg">
                    AI-powered itinerary optimization with real-time safety analysis
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Welcome back, {user.firstName || user.emailAddresses[0]?.emailAddress}!
                  </p>
                </div>
                <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                  <motion.button 
                    whileHover={{ scale: 1.1 }} 
                    whileTap={{ scale: 0.9 }} 
                    className="p-3 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors" 
                    title="Settings"
                  >
                    <Settings className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    onClick={handleSaveRoute} 
                    disabled={!routeAnalysis || isSaving} 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }} 
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save Route
                  </motion.button>
                </div>
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <div className="relative flex space-x-1 bg-slate-800/50 rounded-xl p-1 mb-8">
              {['planner', 'analysis', 'safety'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative flex-1 px-3 py-3 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                    activeTab !== tab ? 'text-slate-400 hover:text-white' : ''
                  }`}
                >
                  {activeTab === tab && (
                    <motion.div
                      layoutId="active-tab-indicator"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg z-0"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 capitalize flex items-center justify-center gap-2">
                    {tab === 'planner' && <Route className="w-5 h-5"/>}
                    {tab === 'analysis' && <Brain className="w-5 h-5"/>}
                    {tab === 'safety' && <Shield className="w-5 h-5"/>}
                    {tab}
                  </span>
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Panel: Form Inputs */}
              <motion.div 
                className="lg:col-span-1 space-y-6" 
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.7 }}
              >
                
                {/* Locations Card */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-cyan-400" />
                    Locations
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Starting Point</label>
                      <input 
                        type="text" 
                        value={routeData.origin} 
                        onChange={(e) => handleInputChange('origin', e.target.value)} 
                        placeholder="e.g., Delhi" 
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Destinations</label>
                      <AnimatePresence>
                        {routeData.destinations.map((dest, index) => (
                          <motion.div 
                            key={index} 
                            layout 
                            initial={{ opacity: 0, y: -10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }} 
                            className="flex items-center space-x-2 mb-2"
                          >
                            <input 
                              type="text" 
                              value={dest} 
                              onChange={(e) => updateDestination(index, e.target.value)} 
                              placeholder={`Destination ${index + 1}`} 
                              className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                            />
                            {routeData.destinations.length > 1 && (
                              <motion.button 
                                whileHover={{ scale: 1.2 }} 
                                whileTap={{ scale: 0.9 }} 
                                onClick={() => removeDestination(index)} 
                                className="p-2 text-red-400 hover:bg-red-400/20 rounded-full transition-colors"
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      <button 
                        onClick={addDestination} 
                        className="w-full mt-2 px-4 py-2 border-2 border-dashed border-slate-600 rounded-xl text-slate-400 hover:border-cyan-400 hover:text-cyan-400 transition-colors flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4 mr-2" />Add Destination
                      </button>
                    </div>
                  </div>
                </div>

                {/* Travel Mode Card */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Navigation className="w-5 h-5 mr-2 text-purple-400" />
                    Travel Mode
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {travelModes.map((mode) => (
                      <button 
                        key={mode.id} 
                        onClick={() => handleInputChange('travelMode', mode.id)} 
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center ${
                          routeData.travelMode === mode.id 
                            ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400' 
                            : 'border-slate-600 hover:border-slate-500 text-slate-300'
                        }`}
                      >
                        <mode.icon className="w-6 h-6 mb-2" />
                        <span className="text-sm font-medium">{mode.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Travel Dates Card */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-400" />
                    Travel Dates
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
                      <input 
                        type="date" 
                        value={routeData.travelDates.startDate} 
                        onChange={(e) => handleInputChange('travelDates', { ...routeData.travelDates, startDate: e.target.value })} 
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
                      <input 
                        type="date" 
                        value={routeData.travelDates.endDate} 
                        onChange={(e) => handleInputChange('travelDates', { ...routeData.travelDates, endDate: e.target.value })} 
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Preferences Card */}
                <div className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                  <h3 className="text-xl font-semibold mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-yellow-400" />
                    Preferences
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Budget Range</label>
                      <select 
                        value={routeData.preferences.budget} 
                        onChange={(e) => handlePreferenceChange('budget', e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                      >
                        {budgetOptions.map((option) => ( 
                          <option key={option.id} value={option.id}>{option.name} ({option.range})</option> 
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Interests</label>
                      <div className="flex flex-wrap gap-2">
                        {interestOptions.map((interest) => (
                          <button 
                            key={interest} 
                            onClick={() => toggleInterest(interest)} 
                            className={`px-3 py-1.5 text-xs rounded-full transition-all ${
                              routeData.preferences.interests.includes(interest) 
                                ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400' 
                                : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            {interest}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Safety Priority</label>
                      <select 
                        value={routeData.preferences.safetyPriority} 
                        onChange={(e) => handlePreferenceChange('safetyPriority', e.target.value)} 
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
                      >
                        <option value="high">High - Prioritize safest routes</option>
                        <option value="medium">Medium - Balance safety & efficiency</option>
                        <option value="low">Low - Focus on shortest routes</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Analyze Button */}
                <motion.button 
                  onClick={analyzeRoute} 
                  disabled={isAnalyzing} 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Route...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Analyze Route with AI
                    </>
                  )}
                </motion.button>
              </motion.div>

              {/* Right Panel: Results */}
              <motion.div 
                className="lg:col-span-2" 
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {!routeAnalysis ? (
                    <motion.div 
                      key="placeholder" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }} 
                      className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-12 text-center h-full flex flex-col justify-center"
                    >
                      <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                        <Route className="w-12 h-12 text-white" />
                      </div>
                      <h3 className="text-2xl font-semibold mb-4 text-white">Ready to Plan Your Route?</h3>
                      <p className="text-slate-300 mb-6 max-w-md mx-auto">
                        Enter your locations and preferences, then let our AI analyze the safest and most efficient route for your journey.
                      </p>
                      
                      {/* Show saved routes if available */}
                      {savedRoutes.length > 0 && (
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold mb-4 text-white">Your Saved Routes</h4>
                          <div className="grid gap-2 max-w-md mx-auto">
                            {savedRoutes.slice(0, 3).map((route) => (
                              <div key={route._id} className="text-left p-3 bg-slate-700/30 rounded-lg">
                                <div className="font-medium text-white">{route.name}</div>
                                <div className="text-sm text-slate-400">
                                  {new Date(route.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="results" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1, transition: { staggerChildren: 0.1 } }} 
                      exit={{ opacity: 0 }} 
                      className="space-y-6"
                    >
                      
                      
                      {/* Route Overview Card */}
                      <motion.div 
                        variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} 
                        className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                          <h3 className="text-2xl font-semibold text-white mb-3 sm:mb-0">Route Analysis</h3>
                          <div className="flex items-center space-x-2">
                            <motion.button 
                              onClick={handleDownloadPDF} 
                              whileHover={{ scale: 1.1 }} 
                              title="Download PDF" 
                              className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                              <Download className="w-5 h-5" />
                            </motion.button>
                            <motion.button 
                              onClick={handleShare} 
                              whileHover={{ scale: 1.1 }} 
                              title="Share" 
                              className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                            >
                              <Share2 className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-3 gap-4 mb-6">
                          <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                            <div className="text-3xl font-bold text-cyan-400 mb-1">{routeAnalysis.totalDistance}</div>
                            <div className="text-sm text-slate-400">Total Distance</div>
                          </div>
                          <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                            <div className="text-2xl font-bold text-purple-400 mb-1">{routeAnalysis.estimatedDuration}</div>
                            <div className="text-sm text-slate-400">Est. Duration</div>
                          </div>
                          <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                            <div className={`text-3xl font-bold mb-1 ${
                              routeAnalysis.overallSafetyScore >= 8 ? 'text-emerald-400' : 
                              routeAnalysis.overallSafetyScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {routeAnalysis.overallSafetyScore}<span className="text-xl">/10</span>
                            </div>
                            <div className="text-sm text-slate-400">Safety Score</div>
                          </div>
                        </div>
                        
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold mb-3 text-white">Risk Assessment</h4>
                          <div className="grid md:grid-cols-2 gap-3">
                            {Object.entries(routeAnalysis.riskAssessment).map(([risk, level]) => (
                              <div key={risk} className="p-3 bg-slate-700/30 rounded-xl flex items-center justify-between">
                                <span className="text-sm text-slate-300 capitalize">
                                  {risk.replace('Risk', ' Risk')}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  level === 'Low' ? 'bg-emerald-500/20 text-emerald-400' : 
                                  level === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {level}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-lg font-semibold mb-3 text-white flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
                            AI Insights
                          </h4>
                          <div className="space-y-2">
                            {routeAnalysis.aiInsights.map((insight, index) => (
                              <div key={index} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded-xl">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1.5 flex-shrink-0"></div>
                                <p className="text-slate-300 text-sm">{insight}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                      {/* Enhanced Safety Intelligence Section */}
            {routeAnalysis.safetyIntelligence && (
              <motion.div 
                variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} 
                className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
              >
                <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-400" />
                  AI Safety Intelligence
                </h3>
                
                {/* Origin Safety */}
                {routeAnalysis.safetyIntelligence.originSafety && (
                  <div className="mb-4 p-4 bg-slate-700/30 rounded-xl">
                    <h4 className="font-semibold text-cyan-400 mb-2">Origin: {routeData.origin}</h4>
                    <div className="flex items-center justify-between mb-2">
                      <span>Safety Score:</span>
                      <span className={`font-bold ${
                        routeAnalysis.safetyIntelligence.originSafety.safetyScore >= 8 ? 'text-green-400' :
                        routeAnalysis.safetyIntelligence.originSafety.safetyScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {routeAnalysis.safetyIntelligence.originSafety.safetyScore}/10
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{routeAnalysis.safetyIntelligence.originSafety.overallAssessment}</p>
                  </div>
                )}
    
              {/* Destination Safety */}
              {routeAnalysis.safetyIntelligence.destinationSafety && (
                <div className="mb-4 p-4 bg-slate-700/30 rounded-xl">
                  <h4 className="font-semibold text-purple-400 mb-2">Destination: {routeData.destinations[0]}</h4>
                  <div className="flex items-center justify-between mb-2">
                    <span>Safety Score:</span>
                    <span className={`font-bold ${
                      routeAnalysis.safetyIntelligence.destinationSafety.safetyScore >= 8 ? 'text-green-400' :
                      routeAnalysis.safetyIntelligence.destinationSafety.safetyScore >= 6 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {routeAnalysis.safetyIntelligence.destinationSafety.safetyScore}/10
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{routeAnalysis.safetyIntelligence.destinationSafety.overallAssessment}</p>
                </div>
              )}

              {/* Route-Specific Risks */}
              {routeAnalysis.safetyIntelligence.routeSpecificSafety?.routeSpecificRisks && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                  <h4 className="font-semibold text-yellow-400 mb-2">Route-Specific Considerations</h4>
                  <ul className="space-y-1">
                    {routeAnalysis.safetyIntelligence.routeSpecificSafety.routeSpecificRisks.map((risk, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start">
                        <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 text-yellow-400 flex-shrink-0" />
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

                      {/* Detailed Route Breakdown Card */}
                      <motion.div 
                        variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} 
                        className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
                      >
                        <h3 className="text-xl font-semibold mb-4 text-white">Detailed Route Breakdown</h3>
                        <div className="space-y-4">
                          {routeAnalysis.routeSegments.map((segment, index) => (
                            <div key={index} className="border border-slate-700/50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-white">{segment.from} → {segment.to}</h4>
                                    <p className="text-sm text-slate-400">{segment.distance} • {segment.duration}</p>
                                  </div>
                                </div>
                                <div className={`px-2.5 py-1 rounded-md text-sm font-semibold ${
                                  segment.safetyScore >= 8 ? 'bg-emerald-500/20 text-emerald-400' : 
                                  segment.safetyScore >= 6 ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-red-500/20 text-red-400'
                                }`}>
                                  {segment.safetyScore}/10
                                </div>
                              </div>
                              
                              {segment.riskFactors?.length > 0 && (
                                <div className="mb-2 pl-12">
                                  <h5 className="text-sm font-medium text-red-400 mb-1 flex items-center">
                                    <AlertTriangle className="w-4 h-4 mr-1.5" />
                                    Risk Factors
                                  </h5>
                                  <ul className="space-y-1">
                                    {segment.riskFactors.map((risk, i) => (
                                      <li key={i} className="text-sm text-slate-300 flex items-center">
                                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></div>
                                        {risk}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              <div className="pl-12">
                                <h5 className="text-sm font-medium text-emerald-400 mb-1 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-1.5" />
                                  Recommendations
                                </h5>
                                <ul className="space-y-1">
                                  {segment.recommendations?.map((rec, i) => (
                                    <li key={i} className="text-sm text-slate-300 flex items-center">
                                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2"></div>
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Emergency Contacts Card */}
                      <motion.div 
                        variants={{hidden: {opacity: 0, y: 20}, visible: {opacity: 1, y: 0}}} 
                        className="bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6"
                      >
                        <h3 className="text-xl font-semibold mb-6 text-white flex items-center">
                          <Phone className="w-5 h-5 mr-2 text-red-400" />
                          Emergency Contacts
                        </h3>
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {routeAnalysis.emergencyContacts.map((contact, index) => (
                            <div key={index} className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                              <h4 className="font-semibold text-white mb-2">{contact.name}</h4>
                              <div className="text-2xl font-bold text-red-400 mb-3">{contact.number}</div>
                              <motion.a 
                                href={`tel:${contact.number}`} 
                                whileHover={{ scale: 1.05 }} 
                                whileTap={{ scale: 0.95 }} 
                                className="w-full inline-block px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white font-medium transition-colors"
                              >
                                Call Now
                              </motion.a>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
