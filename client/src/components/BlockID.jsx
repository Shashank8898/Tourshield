import { useState,useEffect } from "react";
import { useNavigate,useParams } from "react-router-dom";
import Profile from "./Profile.jsx";

export default function TripFormPage() {

  const userID = useParams().userID;
  console.log("UserID from params:", userID);

  

  const [formData, setFormData] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    // tripType: "",
    transport: "",
    // accommodation: "",
    // activities: "" // comma-separated list
  });

  


  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  try {

  
    // Prepare data to send
    const dataToSend = {
      userId: userID, // send user ID
      ...formData
    };

    // Send POST request to backend
    const response = await fetch("http://localhost:5000/trip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSend),
    });

    const result = await response.json();

    if (response.ok) {
      setFormData({
        destination: "",
        startDate: "",
        endDate: "",
        tripType: "",
        transport: "",
        accommodation: "",
        activities: "",
      });
      alert("Trip Digital ID created successfully!");
      navigate(`/${userID}/Profile`); // redirect to profile or home
    } else {
      alert(`Error: ${result.error || result.message}`);
    }
  } catch (error) {
    console.error("Error submitting form:", error);
    alert("Something went wrong!");
  }
};


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600">TourShield</h1>
        <div className="flex gap-6 text-gray-700 font-medium">
          <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
          <a href="/profile" className="hover:text-blue-600 transition-colors">Profile</a>
          <a href="/trip" className="hover:text-blue-600 transition-colors">New Trip</a>
        </div>
      </nav>

      {/* Trip Form Section */}
      <section className="flex items-center justify-center flex-grow px-6">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-2xl transform transition duration-700 hover:scale-105">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
            Create Trip Digital ID
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Destination */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Destination</label>
              <input
                type="text"
                name="destination"
                value={formData.destination}
                onChange={handleChange}
                placeholder="City, Landmark, or Place"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">End Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Trip Type */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Trip Type</label>
              <select
                name="tripType"
                value={formData.tripType}
                onChange={handleChange}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select Trip Type</option>
                <option value="solo">Solo</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="business">Business</option>
              </select>
            </div>

            {/* Transportation */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Transportation</label>
              <input
                type="text"
                name="transport"
                value={formData.transport}
                onChange={handleChange}
                placeholder="Flight, Train, Car, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Accommodation */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Accommodation</label>
              <input
                type="text"
                name="accommodation"
                value={formData.accommodation}
                onChange={handleChange}
                placeholder="Hotel, Airbnb, Hostel, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Activities */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Planned Activities</label>
              <input
                type="text"
                name="activities"
                value={formData.activities}
                onChange={handleChange}
                placeholder="E.g. Eiffel Tower, Louvre Museum"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              onSubmit={handleSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-blue-700 transform transition duration-300 hover:scale-105"
            >
              Create Trip ID
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-300 text-center">
        <p>© {new Date().getFullYear()} TourShield. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
