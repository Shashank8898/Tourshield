'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Shield, MapPin, Users, Phone, AlertTriangle, Eye, Brain, Globe, Lock, Smartphone, CheckCircle, ArrowRight, Zap, Heart, Star, User, Camera, Wifi, Map, Database, Bell } from 'lucide-react'

export default function HomePage() {
  const [user, setUser] = useState(null)
  const [mounted, setMounted] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const storedUser = typeof window !== 'undefined' ? sessionStorage.getItem("user") : null
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log("Logged-in User ID:", parsedUser.id)
      } catch (err) {
        console.error("Failed to parse user:", err)
        setUser(null)
      }
    }

    // Auto-cycle through steps
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem("token")
      sessionStorage.removeItem("user")
    }
    setUser(null)
    router.push("/")
  }

  if (!mounted) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"></div>
  }

  const processSteps = [
    {
      id: 1,
      icon: User,
      title: "Digital Identity Creation",
      description: "Secure blockchain-based ID generation with KYC verification at entry points",
      details: "Upload your Aadhaar/Passport, add emergency contacts, and get your tamper-proof digital tourist ID instantly.",
      color: "from-cyan-400 to-blue-500"
    },
    {
      id: 2,
      icon: MapPin,
      title: "Smart Route Planning",
      description: "AI-powered itinerary analysis with safety scoring for your planned destinations",
      details: "Our AI evaluates your travel route, assigns safety scores, and provides real-time risk assessments.",
      color: "from-violet-400 to-purple-500"
    },
    {
      id: 3,
      icon: Eye,
      title: "Real-Time Monitoring",
      description: "Continuous location tracking with geo-fence alerts and anomaly detection",
      details: "24/7 AI monitoring detects unusual patterns, sends alerts, and ensures you stay on safe paths.",
      color: "from-emerald-400 to-green-500"
    },
    {
      id: 4,
      icon: Shield,
      title: "Emergency Response",
      description: "Instant SOS alerts to police, family, and nearest medical facilities",
      details: "One-tap emergency activation connects you to authorities with precise location and medical info.",
      color: "from-orange-400 to-red-500"
    }
  ]

  const features = [
    {
      category: "Identity & Security",
      items: [
        {
          icon: Shield,
          title: "Blockchain Digital ID",
          description: "Tamper-proof identity verification with KYC integration and trip validity tracking.",
          gradient: "from-blue-500 to-cyan-400"
        },
        {
          icon: Lock,
          title: "End-to-End Encryption",
          description: "Military-grade security ensuring complete privacy of personal and location data.",
          gradient: "from-purple-500 to-pink-400"
        },
        {
          icon: Database,
          title: "Secure Data Storage",
          description: "Distributed blockchain storage with zero-knowledge privacy protocols.",
          gradient: "from-indigo-500 to-purple-400"
        }
      ]
    },
    {
      category: "AI-Powered Safety",
      items: [
        {
          icon: Brain,
          title: "Behavioral Analysis",
          description: "Advanced ML algorithms detect anomalies in movement patterns and predict risks.",
          gradient: "from-green-500 to-emerald-400"
        },
        {
          icon: Zap,
          title: "Predictive Alerts",
          description: "Proactive warnings about weather, political situations, and area-specific risks.",
          gradient: "from-yellow-500 to-orange-400"
        },
        {
          icon: Map,
          title: "Dynamic Risk Mapping",
          description: "Real-time heat maps showing crime rates, natural hazards, and safe zones.",
          gradient: "from-red-500 to-pink-400"
        }
      ]
    },
    // {
    //   category: "Communication & Support",
    //   items: [
    //     {
    //       icon: Globe,
    //       title: "Multi-Language AI",
    //       description: "Voice and text support in 10+ Indian languages with dialect recognition.",
    //       gradient: "from-teal-500 to-green-400"
    //     },
    //     {
    //       icon: Wifi,
    //       title: "Offline Capabilities",
    //       description: "Critical safety functions work without internet using satellite connectivity.",
    //       gradient: "from-blue-500 to-teal-400"
    //     },
    //     {
    //       icon: Bell,
    //       title: "Smart Notifications",
    //       description: "Context-aware alerts that learn your preferences and emergency contacts.",
    //       gradient: "from-purple-500 to-indigo-400"
    //     }
    //   ]
    // }
  ]

  const stats = [
    { number: "99.8%", label: "Incident Prevention Rate", icon: Shield },
    { number: "<30s", label: "Emergency Response Time", icon: Zap },
    { number: "24/7", label: "AI Monitoring Active", icon: Eye },
    { number: "15+", label: "Languages Supported", icon: Globe }
  ]

  const testimonials = [
    {
      name: "Dr. Rajesh Kumar",
      role: "Tourism Director, Meghalaya",
      content: "TourShield has revolutionized how we ensure tourist safety. The AI predictions have prevented over 200 potential incidents.",
      avatar: "👨‍💼"
    },
    {
      name: "Sarah Chen",
      role: "Solo Traveler",
      content: "The geo-fence alerts saved me from entering a restricted area. My family felt secure tracking my journey in real-time.",
      avatar: "👩‍🦱"
    },
    {
      name: "Inspector Amit Singh",
      role: "Tourist Police, Himachal Pradesh",
      content: "The automated E-FIR generation and real-time dashboards have reduced our response time by 75%.",
      avatar: "👮‍♂️"
    }
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Enhanced Navbar */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Shield className="h-10 w-10 text-cyan-400" />
            <div className="absolute inset-0 h-10 w-10 text-cyan-400 animate-ping opacity-20"></div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
            TourShield
          </h1>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <a href="#process" className="text-slate-300 hover:text-cyan-400 transition-all duration-300 hover:scale-105">How It Works</a>
          <a href="#features" className="text-slate-300 hover:text-cyan-400 transition-all duration-300 hover:scale-105">Features</a>
          <a href="#testimonials" className="text-slate-300 hover:text-cyan-400 transition-all duration-300 hover:scale-105">Stories</a>
          <a href="#contact" className="text-slate-300 hover:text-cyan-400 transition-all duration-300 hover:scale-105">Support</a>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href={`/${user.id}/profile`}>
                <button className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-300">
                  My Profile
                </button>
              </Link>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-full font-semibold transition-all duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <button className="px-6 py-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-300">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-semibold hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-300">
                  Get Started
                </button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center z-10">
          <div className="mb-8 inline-flex items-center px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-full backdrop-blur-sm">
            <Star className="w-4 h-4 text-yellow-400 mr-2" />
            <span className="text-sm text-slate-300">Trusted by 50,000+ travelers across India</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight">
            <span className="block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
              Beyond Safety,
            </span>
            <span className="block text-white">Into Intelligence</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
            The world's first AI-powered tourist safety ecosystem combining blockchain identity, 
            predictive analytics, and real-time emergency response for the modern traveler.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/routeplanning">
              <button className="group px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl font-bold text-lg flex items-center gap-3 hover:shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-500">
                Create Digital ID
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link href="/emergency-sos">
              <button className="group px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl font-bold text-lg flex items-center gap-3 hover:shadow-2xl hover:shadow-red-500/25 transform hover:scale-105 transition-all duration-500 animate-pulse">
                <Heart className="w-5 h-5 animate-pulse" />
                Emergency SOS
              </button>
            </Link>
            <Link href="/authority-dashboard">
              <button className="px-8 py-4 border-2 border-slate-600 hover:border-purple-400 rounded-2xl font-semibold text-lg hover:bg-slate-800/50 transform hover:scale-105 transition-all duration-300">
                Authority Access
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="group p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl hover:bg-slate-800/50 transition-all duration-300">
                <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="process" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              How TourShield Protects You
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              A seamless four-step process that transforms your travel experience from vulnerable to invincible
            </p>
          </div>

          <div className="relative">
            {/* Process Steps */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {processSteps.map((step, index) => (
                <div key={step.id} className={`relative group cursor-pointer transition-all duration-500 ${activeStep === index ? 'scale-105' : 'hover:scale-105'}`}>
                  <div className={`p-8 bg-slate-800/40 backdrop-blur-sm border ${activeStep === index ? 'border-cyan-400 shadow-2xl shadow-cyan-400/20' : 'border-slate-700/50'} rounded-3xl transition-all duration-500`}>
                    <div className={`w-16 h-16 mb-6 bg-gradient-to-r ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                    <p className="text-slate-300 mb-4">{step.description}</p>
                    <p className="text-sm text-slate-400 leading-relaxed">{step.details}</p>
                  </div>
                  {/* Step Number */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.id}
                  </div>
                </div>
              ))}
            </div>

            {/* Connection Lines */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent -translate-y-1/2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-bold mb-6 text-white">
              Advanced Features for Complete Protection
            </h2>
            <p className="text-xl text-slate-300 max-w-4xl mx-auto">
              Cutting-edge technology stack designed to anticipate, prevent, and respond to any safety challenge
            </p>
          </div>

          {features.map((category, categoryIndex) => (
            <div key={category.category} className="mb-16">
              <h3 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                {category.category}
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="group relative overflow-hidden">
                    <div className="p-8 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/50 transition-all duration-500 hover:border-slate-600 h-full">
                      {/* Icon with gradient background */}
                      <div className={`w-14 h-14 mb-6 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    {/* Hover Gradient Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${item.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-3xl pointer-events-none`}></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative py-24 px-6 bg-slate-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-white">Real Stories, Real Impact</h2>
            <p className="text-xl text-slate-300">Hear from travelers and authorities who trust TourShield</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/70 transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-2xl mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                    <p className="text-slate-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-slate-300 leading-relaxed italic">"{testimonial.content}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="relative py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-6 text-white">Always Here When You Need Us</h2>
            <p className="text-xl text-slate-300">24/7 emergency support across multiple channels</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-3xl text-center hover:scale-105 transition-all duration-300">
              <Phone className="w-16 h-16 text-red-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Emergency Hotline</h3>
              <div className="text-3xl font-bold text-red-400 mb-2">+91 7428469988</div>
              <p className="text-slate-300">Immediate response for critical situations</p>
            </div>

            <div className="p-8 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-3xl text-center hover:scale-105 transition-all duration-300">
              <Shield className="w-16 h-16 text-blue-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Tourist Helpline</h3>
              <div className="text-3xl font-bold text-blue-400 mb-2">1363</div>
              <p className="text-slate-300">General assistance and guidance</p>
            </div>

            <div className="p-8 bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-3xl text-center hover:scale-105 transition-all duration-300">
              <AlertTriangle className="w-16 h-16 text-green-400 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-white mb-4">Police Control</h3>
              <div className="text-3xl font-bold text-green-400 mb-2">100</div>
              <p className="text-slate-300">Direct line to law enforcement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <Shield className="h-10 w-10 text-cyan-400" />
                <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  TourShield
                </h3>
              </div>
              <p className="text-slate-400 leading-relaxed mb-6">
                The world's most advanced AI-powered tourist safety monitoring system, 
                ensuring secure travel experiences through cutting-edge technology.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-cyan-500 transition-colors cursor-pointer">
                  <span className="text-sm">📧</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-blue-500 transition-colors cursor-pointer">
                  <span className="text-sm">📱</span>
                </div>
                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-purple-500 transition-colors cursor-pointer">
                  <span className="text-sm">🌐</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Services</h4>
              <ul className="space-y-3">
                <li><Link href="/digital-id" className="text-slate-400 hover:text-cyan-400 transition-colors">Digital ID Creation</Link></li>
                <li><Link href="/geo-fencing" className="text-slate-400 hover:text-cyan-400 transition-colors">Smart Geo-Fencing</Link></li>
                <li><Link href="/ai-monitoring" className="text-slate-400 hover:text-cyan-400 transition-colors">AI Monitoring</Link></li>
                <li><Link href="/emergency" className="text-slate-400 hover:text-cyan-400 transition-colors">Emergency Response</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Technology</h4>
              <ul className="space-y-3">
                <li><Link href="/blockchain" className="text-slate-400 hover:text-cyan-400 transition-colors">Blockchain Security</Link></li>
                <li><Link href="/ai-features" className="text-slate-400 hover:text-cyan-400 transition-colors">AI & ML Features</Link></li>
                <li><Link href="/iot-integration" className="text-slate-400 hover:text-cyan-400 transition-colors">IoT Integration</Link></li>
                <li><Link href="/api-docs" className="text-slate-400 hover:text-cyan-400 transition-colors">API Documentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold mb-6 text-white">Support</h4>
              <ul className="space-y-3">
                <li><Link href="/help-center" className="text-slate-400 hover:text-cyan-400 transition-colors">Help Center</Link></li>
                <li><Link href="/privacy-policy" className="text-slate-400 hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-slate-400 hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-cyan-400 transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center">
            <p className="text-slate-400">
              © {new Date().getFullYear()} TourShield. All rights reserved. | 
              <span className="text-cyan-400 ml-1">Securing 50,000+ travelers across India</span>
            </p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}