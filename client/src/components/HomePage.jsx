import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

 useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser); // store entire user object
        console.log("Logged-in User ID:", parsedUser.id); // ✅ access userId
      } catch (err) {
        console.error("Failed to parse user:", err);
        setUser(null);
      }
    }
  }, [setUser]);

  const handleLogout = () => {
    localStorage.removeItem("token"); // remove JWT
    localStorage.removeItem("user");  // remove user info
    setUser(null);                    // update state
    navigate("/");                     // redirect to home
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600 transition-transform duration-700 ease-in-out hover:scale-105">
          TourShield
        </h1>
        <div className="flex gap-6 text-gray-700 font-medium">
          {user ? (
            <>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors transform hover:scale-105"
              >
                Logout
              </button>
              <Link to={`/${user.id}/TripFile`}>Profile</Link>

            </>
          ) : (
            <Link
              to="/login"
              className="hover:text-blue-600 transition-colors"
            >
              Login
            </Link>
          )}
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="flex flex-col items-center justify-center text-center py-24 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-4">
          Your shield of safety in unfamiliar land
        </h2>
        <p className="text-lg md:text-xl mb-6 max-w-2xl">
          TourShield ensures a safe and secure travel experience by offering real-time alerts, emergency support, and trusted trip monitoring.
        </p>
        <Link to='/getStarted'>
          <button className="bg-white text-blue-600 hover:bg-gray-200 text-lg px-6 py-3 rounded-xl shadow-md transform transition duration-300 hover:scale-105">
            Get Started
          </button>
        </Link>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 md:px-16 bg-gray-100">
        <h3 className="text-3xl font-bold text-center mb-12">Features</h3>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="bg-white shadow-md rounded-xl p-6 flex flex-col items-center text-center transform transition duration-500 hover:scale-105 hover:shadow-lg">
            <div className="w-12 h-12 mb-4 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full text-xl font-bold animate-bounce">
              ✓
            </div>
            <h4 className="text-xl font-semibold mb-2">Secure Travel</h4>
            <p>Stay protected with real-time safety updates and trusted monitoring.</p>
          </div>

          <Link to='/livelocation'>
            <div className="bg-white shadow-md rounded-xl p-6 flex flex-col items-center text-center transform transition duration-500 hover:scale-105 hover:shadow-lg">
              <div className="w-12 h-12 mb-4 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full text-xl font-bold animate-pulse">
              </div>
              <h4 className="text-xl font-semibold mb-2">Live Location</h4>
              <p>Share and track your journey with precision and reliability.</p>
            </div>
          </Link>

          <div className="bg-white shadow-md rounded-xl p-6 flex flex-col items-center text-center transform transition duration-500 hover:scale-105 hover:shadow-lg">
            <div className="w-12 h-12 mb-4 bg-blue-100 text-blue-600 flex items-center justify-center rounded-full text-xl font-bold animate-spin-slow">
              🤝
            </div>
            <h4 className="text-xl font-semibold mb-2">Community Support</h4>
            <p>Connect with other travelers and get help when you need it.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section
        id="contact"
        className="py-16 px-6 md:px-16 bg-white text-center"
      >
        <h3 className="text-3xl font-bold mb-6">Contact Us</h3>
        <p className="mb-4">Need help or have questions? We're just a call away.</p>
        <div className="flex justify-center items-center gap-2 text-blue-600 font-medium">
          📞 <span>+91 7428469988</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-300 text-center">
        <p>© {new Date().getFullYear()} TourShield. All Rights Reserved.</p>
      </footer>

      {/* Animations */}
      <style>{`
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
      `}</style>
    </div>
  );
}
