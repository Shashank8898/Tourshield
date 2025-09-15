"use client";
import React, { useState, useEffect } from 'react';
import { Shield, User, Calendar, Globe, Heart, Phone, Droplets, MapPin, Route, Clock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';


export default function TouristRegistrationForm() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    dateOfBirth: '',
    nationality: '',
    medicalConditions: '',
    contactNumber: '',
    bloodGroup: '',
    destinationTo: '',
    destinationFrom: '',
    tripId: '',
    startingDate: '',
    endingDate: ''
  });

  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const countries = ['India', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'Other'];

  const steps = [
    {
      id: 1,
      title: 'Personal Info',
      icon: User,
      fields: ['fullName', 'dateOfBirth', 'nationality', 'contactNumber']
    },
    {
      id: 2,
      title: 'Medical Details',
      icon: Heart,
      fields: ['bloodGroup', 'medicalConditions']
    },
    {
      id: 3,
      title: 'Travel Plans',
      icon: Route,
      fields: ['destinationFrom', 'destinationTo', 'startingDate', 'endingDate', 'tripId']
    }
  ];

  const validateField = (name, value) => {
    const newErrors = {};
    
    switch (name) {
      case 'fullName':
        if (!value.trim()) newErrors[name] = 'Full name is required';
        else if (value.trim().length < 2) newErrors[name] = 'Name must be at least 2 characters';
        break;
      case 'dateOfBirth':
        if (!value) newErrors[name] = 'Date of birth is required';
        else {
          const today = new Date();
          const birthDate = new Date(value);
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 18) newErrors[name] = 'Must be at least 18 years old';
        }
        break;
      case 'contactNumber':
        if (!value) newErrors[name] = 'Contact number is required';
        else if (!/^[\+]?[0-9]{10,15}$/.test(value.replace(/\s+/g, ''))) {
          newErrors[name] = 'Please enter a valid phone number';
        }
        break;
      case 'nationality':
      case 'bloodGroup':
      case 'destinationFrom':
      case 'destinationTo':
      case 'startingDate':
      case 'endingDate':
        if (!value) newErrors[name] = `${name.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`;
        break;
      case 'tripId':
        if (!value) newErrors[name] = 'Trip ID is required';
        else if (value.length < 6) newErrors[name] = 'Trip ID must be at least 6 characters';
        break;
    }

    // Date validation for trip dates
    if (name === 'endingDate' && value && formData.startingDate) {
      if (new Date(value) <= new Date(formData.startingDate)) {
        newErrors[name] = 'End date must be after start date';
      }
    }

    return newErrors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touchedFields[name]) {
      const fieldErrors = validateField(name, value);
      setErrors(prev => ({ ...prev, ...fieldErrors, [name]: fieldErrors[name] || undefined }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedFields(prev => ({ ...prev, [name]: true }));
    const fieldErrors = validateField(name, value);
    setErrors(prev => ({ ...prev, ...fieldErrors }));
  };

  const validateCurrentStep = () => {
    const currentFields = steps[currentStep - 1].fields;
    let stepErrors = {};
    
    currentFields.forEach(field => {
      const fieldErrors = validateField(field, formData[field]);
      stepErrors = { ...stepErrors, ...fieldErrors };
    });

    setErrors(prev => ({ ...prev, ...stepErrors }));
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    
    // Simulate API call
    const data = fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/routes/createId`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(FormData)
    })
    
    alert('Registration successful! Your digital ID is being created.');

    setIsSubmitting(false);
    router.push("/")
  };

  const generateTripId = () => {
    const id = 'TS' + Math.random().toString(36).substr(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, tripId: id }));
  };

  useEffect(() => {
    // Auto-generate trip ID if empty
    if (!formData.tripId) {
      generateTripId();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Shield className="h-16 w-16 text-cyan-400" />
              <div className="absolute inset-0 h-16 w-16 text-cyan-400 animate-ping opacity-20"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Create Your Digital ID
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Join the future of safe travel with blockchain-verified identity and AI-powered protection
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`relative flex items-center justify-center w-16 h-16 rounded-2xl transition-all duration-500 ${
                  currentStep >= step.id 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/25' 
                    : 'bg-slate-800 border-2 border-slate-600'
                }`}>
                  <step.icon className={`w-8 h-8 ${currentStep >= step.id ? 'text-white' : 'text-slate-400'}`} />
                  {currentStep > step.id && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white animate-scale-in" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className={`font-semibold ${currentStep >= step.id ? 'text-cyan-400' : 'text-slate-400'}`}>
                    Step {step.id}
                  </div>
                  <div className={`text-sm ${currentStep >= step.id ? 'text-white' : 'text-slate-500'}`}>
                    {step.title}
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-px ml-8 ${currentStep > step.id ? 'bg-cyan-400' : 'bg-slate-600'}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-slide-in">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <User className="w-8 h-8 mr-3 text-cyan-400" />
                  Personal Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                        errors.fullName ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Date of Birth <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white focus:outline-none transition-all duration-300 ${
                          errors.dateOfBirth ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Nationality <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white focus:outline-none transition-all duration-300 ${
                          errors.nationality ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                      >
                        <option value="">Select nationality</option>
                        {countries.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                    </div>
                    {errors.nationality && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.nationality}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Contact Number <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="tel"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                          errors.contactNumber ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                        placeholder="+91 9876543210"
                      />
                    </div>
                    {errors.contactNumber && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.contactNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Medical Details */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-slide-in">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <Heart className="w-8 h-8 mr-3 text-red-400" />
                  Medical Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Blood Group <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Droplets className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <select
                        name="bloodGroup"
                        value={formData.bloodGroup}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white focus:outline-none transition-all duration-300 ${
                          errors.bloodGroup ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                      >
                        <option value="">Select blood group</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </div>
                    {errors.bloodGroup && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.bloodGroup}
                      </p>
                    )}
                  </div>

                  <div className="group md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Medical Conditions (Optional)
                    </label>
                    <textarea
                      name="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all duration-300"
                      placeholder="List any allergies, chronic conditions, medications, or other medical information that emergency responders should know..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Travel Plans */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-slide-in">
                <h2 className="text-3xl font-bold text-white mb-8 flex items-center">
                  <Route className="w-8 h-8 mr-3 text-purple-400" />
                  Travel Information
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Destination From <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="destinationFrom"
                        value={formData.destinationFrom}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                          errors.destinationFrom ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                        placeholder="Starting city/location"
                      />
                    </div>
                    {errors.destinationFrom && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.destinationFrom}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Destination To <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        name="destinationTo"
                        value={formData.destinationTo}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                          errors.destinationTo ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                        placeholder="Destination city/location"
                      />
                    </div>
                    {errors.destinationTo && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.destinationTo}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Starting Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        name="startingDate"
                        value={formData.startingDate}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        min={new Date().toISOString().split('T')[0]}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white focus:outline-none transition-all duration-300 ${
                          errors.startingDate ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                      />
                    </div>
                    {errors.startingDate && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.startingDate}
                      </p>
                    )}
                  </div>

                  <div className="group">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Ending Date <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="date"
                        name="endingDate"
                        value={formData.endingDate}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        min={formData.startingDate || new Date().toISOString().split('T')[0]}
                        className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white focus:outline-none transition-all duration-300 ${
                          errors.endingDate ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                        }`}
                      />
                    </div>
                    {errors.endingDate && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.endingDate}
                      </p>
                    )}
                  </div>

                  <div className="group md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">
                      Trip ID <span className="text-red-400">*</span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          name="tripId"
                          value={formData.tripId}
                          onChange={handleInputChange}
                          onBlur={handleBlur}
                          className={`w-full pl-12 pr-4 py-3 bg-slate-700/50 border-2 rounded-xl text-white placeholder-slate-400 focus:outline-none transition-all duration-300 ${
                            errors.tripId ? 'border-red-400' : 'border-slate-600 focus:border-cyan-400'
                          }`}
                          placeholder="Unique trip identifier"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={generateTripId}
                        className="px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300"
                      >
                        Generate
                      </button>
                    </div>
                    {errors.tripId && (
                      <p className="text-red-400 text-sm mt-2 flex items-center animate-shake">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.tripId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-8 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-all duration-300 flex items-center"
                >
                  ← Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300 flex items-center"
                >
                  Next →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105 transition-all duration-300 flex items-center disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating ID...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Create Digital ID
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
          <div className="flex items-center mb-4">
            <Shield className="w-6 h-6 text-green-400 mr-3" />
            <h3 className="text-lg font-semibold text-white">Secure & Private</h3>
          </div>
          <p className="text-slate-300 leading-relaxed">
            Your information is protected with military-grade encryption and stored on blockchain. 
            We never share your personal data without explicit consent, and all emergency contacts 
            are notified only during actual safety incidents.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        
        .animate-slide-in {
          animation: slideIn 0.5s ease-out;
        }
        
        .animate-scale-in {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
        
        .group:hover input,
        .group:hover select,
        .group:hover textarea {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(34, 211, 238, 0.1);
        }
      `}</style>
    </div>
  );
}