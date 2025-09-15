import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  // Fetch user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("Logged-in User ID:", parsedUser.id);
        console.log("Logged-in Trip ID:", parsedUser.tripId);
      } catch (err) {
        console.error("Failed to parse user:", err);
        setUser(null);
      }
    }
  }, []);

  if (!user) return <p className="text-center text-gray-500 mt-20">Loading...</p>;

  return (
    <div>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600 transition-transform duration-700 ease-in-out hover:scale-105">
          TourShield
        </h1>
        <div className="flex gap-6 items-center text-gray-700 font-medium">
          <Link
            to={`/${user.id}/TripFile`}
            className="hover:text-blue-600 transition-colors"
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-colors transform hover:scale-105"
          >
            Logout
          </button>
          <a
            href="#features"
            className="hover:text-blue-600 transition-colors"
          >
            Features
          </a>
        </div>
      </nav>

      {/* Profile Container */}
      <div className="max-w-3xl mx-auto p-6 space-y-6 bg-gray-50 rounded-xl shadow-md mt-6">
        {/* User Info */}
        <section className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800">{user.name}</h2>
          <p className="text-gray-600">{user.email}</p>

               {/* QR Code for tripId */}
          {user.tripId && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg shadow-inner">
              <h3 className="text-gray-700 font-medium mb-2">Your Trip QR Code</h3>
              <QRCode value={user.tripId} size={180} level="H" />
            </div>
          )}

        </section>

        
        {/* Settings */}
        <section className="flex gap-3">
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
            Edit Profile
          </button>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition">
            Change Password
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
          >
            Logout
          </button>
        </section>
      </div>
    </div>
  );
}
