import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function GetStartedPage() {
  const [isVisible, setIsVisible] = useState(false);
  const [user,setUser]=useState(null);  //State to track Logged IN user

useEffect(() => {
  setIsVisible(true);

  const storedUser = localStorage.getItem("user"); // might be null or undefined
  let loggedInUser = null;

  try {
    loggedInUser = storedUser ? JSON.parse(storedUser) : null;
  } catch (err) {
    console.error("Failed to parse user from localStorage:", err);
    loggedInUser = null;
  }

  if (loggedInUser) setUser(loggedInUser);
}, []);



  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600 transition-transform duration-700 ease-in-out hover:scale-105">
          TourShield
        </h1>
        <div className="flex gap-6 text-gray-700 font-medium">
          <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
          <a href="/get-started" className="hover:text-blue-600 transition-colors">Get Started</a>
        </div>
      </nav>

      {/* Header Section */}
      <section
        className={`flex flex-col items-center justify-center text-center py-20 px-6 bg-gradient-to-r from-indigo-600 to-blue-500 text-white transition-all duration-1000 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-4">Get Started with TourShield</h2>
        <p className="text-lg md:text-xl max-w-3xl">
          Discover how TourShield makes your journeys safer and more enjoyable. Learn about our core features and how you can start using them today.
        </p>
      </section>

      {/* Features in Detail */}
      <section className="py-20 px-6 md:px-16 bg-gray-100">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="bg-white shadow-md rounded-xl p-8 transition duration-500 transform hover:scale-105 hover:shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">🔒 Secure Travel</h3>
            <p>
              With real-time safety alerts, TourShield ensures you’re always aware of your surroundings. Our trusted monitoring system helps keep you protected no matter where you go.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-8 transition duration-500 transform hover:scale-105 hover:shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">📍 Live Location Tracking</h3>
            <p>
              Share your journey with friends and family in real-time. Our precise tracking system provides reliability and peace of mind during your travels.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-8 transition duration-500 transform hover:scale-105 hover:shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">🤝 Community Support</h3>
            <p>
              Connect with fellow travelers, exchange tips, and get instant help whenever you need it. TourShield builds a community of trust and support.
            </p>
          </div>

          <div className="bg-white shadow-md rounded-xl p-8 transition duration-500 transform hover:scale-105 hover:shadow-lg">
            <h3 className="text-2xl font-bold mb-4 text-blue-600">🚨 Emergency Assistance</h3>
            <p>
              Get quick access to emergency contacts and support services directly within the app. TourShield is always there to back you up when it matters the most.
            </p>
          </div>
        </div>
      </section>

   {/* Call to Action - Signup + Login */}
      {!user && (
        <section className="py-16 px-6 md:px-16 bg-white text-center">
          <h3 className="text-3xl font-bold mb-6">Ready to Begin?</h3>
          <p className="mb-6 max-w-2xl mx-auto">
            Join thousands of travelers who trust TourShield for their safety.  
            Sign up today or log in to continue your journey with confidence.
          </p>

          <div className="flex justify-center gap-6">
            <Link to="/signup">
              <button className="bg-blue-600 text-white hover:bg-blue-700 text-lg px-8 py-3 rounded-xl shadow-md transform transition duration-300 hover:scale-105">
                Sign Up
              </button>
            </Link>

            <Link to="/login">
              <button className="bg-green-600 text-white hover:bg-green-700 text-lg px-8 py-3 rounded-xl shadow-md transform transition duration-300 hover:scale-105">
                Log In
              </button>
            </Link>
          </div>
        </section>
      )}


      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-300 text-center">
        <p>© {new Date().getFullYear()} TourShield. All Rights Reserved.</p>
      </footer>

      {/* Animations */}
    <style>
{`
  .animate-fadeIn {
    animation: fadeIn 1s ease-in forwards;
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`}
</style>

    </div>
  );
}
