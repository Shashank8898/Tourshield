import {createContext ,useState } from "react";
import { useNavigate, Link } from "react-router-dom";
export const UserContext = createContext();


export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState(""); // new state for error message
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // reset error before submit

    try {
      const response = await fetch("http://localhost:5000/User/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem("token", data.token); // store token
        localStorage.setItem("user", JSON.stringify(data.user)); // store user info
        console.log("Logged-in User ID:", data.user.id); // ✅ access userId
        
        navigate("/"); // redirect to homepage/dashboard
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err.message);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600">TourShield</h1>
        <div className="flex gap-6 text-gray-700 font-medium">
          <Link to="/" className="hover:text-blue-600 transition-colors">Home</Link>
          <Link to="/get-started" className="hover:text-blue-600 transition-colors">Get Started</Link>
          <Link to="/signup" className="hover:text-blue-600 transition-colors">Sign Up</Link>
        </div>
      </nav>

      {/* Form Section */}
      <section className="flex items-center justify-center flex-grow px-6">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-2xl transform transition duration-700 hover:scale-105">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
            Log In to Your Account
          </h2>

          {error && (
            <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your E-mail ID"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your Password"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-blue-700 transform transition duration-300 hover:scale-105"
            >
              Log In
            </button>
          </form>

          {/* Redirect to signup */}
          <p className="text-center text-gray-600 mt-6">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 bg-gray-900 text-gray-300 text-center">
        <p>© {new Date().getFullYear()} TourShield. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
