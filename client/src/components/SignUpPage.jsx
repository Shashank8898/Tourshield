import { useEffect, useState } from "react";
import {useNavigate} from 'react-router-dom'


export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: "",
    email:"",
    password:""
  });
  const [error, setError] = useState("");


  const navigate = useNavigate(); // already imported


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/User/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // ✅ redirect user on successful signup
        navigate("/");
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 bg-white shadow-md sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-blue-600">TourShield</h1>
        <div className="flex gap-6 text-gray-700 font-medium">
          <a href="/" className="hover:text-blue-600 transition-colors">Home</a>
          <a href="/get-started" className="hover:text-blue-600 transition-colors">Get Started</a>
          <a href="/signup" className="hover:text-blue-600 transition-colors">Sign Up</a>
        </div>
      </nav>

      {/* Form Section */}
      <section className="flex items-center justify-center flex-grow px-6">
        <div className="bg-white shadow-lg rounded-2xl p-10 w-full max-w-2xl transform transition duration-700 hover:scale-105">
          <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">
            Create Your Account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* MailID */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Email</label>
              <input
                type="text"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your E-mail ID"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                placeholder="Enter the Password"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>   

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg shadow-md hover:bg-blue-700 transform transition duration-300 hover:scale-105"
            >
              Sign Up
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
