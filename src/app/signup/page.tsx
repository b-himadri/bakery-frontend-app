// frontend/src/app/signup/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext"; // Add this line

export default function SignupPage() {
   const router = useRouter();
  const { setUser } = useUser(); 

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "user",
    adminPin: "",
  });

  const [message, setMessage] = useState({
    text: "",
    type: "",
    isVisible: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleChange = (role: "user" | "admin") => {
    setFormData((prev) => ({ ...prev, role, adminPin: "" }));
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type, isVisible: true });
    setTimeout(() => {
      setMessage((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password) {
      showMessage("Please fill all required fields.", "error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showMessage("Passwords do not match.", "error");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          adminPin: formData.role === "admin" ? formData.adminPin : undefined,
        }),
          credentials: 'include', 
      });

      const data = await res.json();
      if (!res.ok) {
        showMessage(data.message || "Signup failed.", "error");
      } else {
        // Save token to localStorage
        localStorage.setItem("token", data.token);
        setUser(data.user); // <-- Update global user context

        showMessage("Signup Successful!", "success");
        // Use a slight delay to allow context updates to propagate before fetching cart and redirecting
        setTimeout(async () => { // Make the callback async
          router.push("/login");
        }, 1500);
      }
    } catch (err) {
      console.error("Signup error:", err);
      showMessage("Something went wrong. Please try again.", "error");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-amber-50 font-inter">
      {message.isVisible && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 transition-all duration-300 ease-out transform
            ${
              message.type === "success"
                ? "bg-amber-100 text-amber-800"
                : "bg-red-200 text-red-800"
            }`}
        >
          <p className="font-semibold text-sm">{message.text}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-amber-50 border border-neutral-200 p-8 rounded-3xl shadow-xl w-full max-w-md transform transition-all duration-300 hover:scale-[1.01]"
        style={{
          boxShadow: "0 15px 30px rgba(101, 67, 33, 0.2)",
        }}
      >
        <h2 className="text-3xl font-extrabold text-amber-800 text-center mb-6 drop-shadow-sm">
          Sign Up
        </h2>

        <div className="flex justify-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange("user")}
            className={`px-5 py-2 rounded-full text-base font-semibold border-2 transition-all duration-200 transform hover:scale-105 ${
              formData.role === "user"
                ? "bg-amber-100 border-amber-100 text-amber-800 shadow-md"
                : "bg-white border-gray-200 text-gray-500 hover:border-amber-100"
            }`}
          >
            I'm a Customer
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange("admin")}
            className={`px-5 py-2 rounded-full text-base font-semibold border-2 transition-all duration-200 transform hover:scale-105 ${
              formData.role === "admin"
                ? "bg-amber-100 border-amber-100 text-amber-800 shadow-md"
                : "bg-white border-gray-200 text-gray-500 hover:border-amber-100"
            }`}
          >
            I'm an Admin
          </button>
        </div>

        <input
          type="text"
          name="name"
          placeholder="Your Name"
          onChange={handleChange}
          required
          className="w-full mb-4 p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-stone-500 text-stone-800"
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          onChange={handleChange}
          required
          className="w-full mb-4 p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-stone-500 text-stone-800"
        />
        <input
          type="password"
          name="password"
          placeholder="Create a Password"
          onChange={handleChange}
          required
          className="w-full mb-4 p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-stone-500 text-stone-800"
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Your Password"
          onChange={handleChange}
          required
          className="w-full mb-6 p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-stone-500 text-stone-800"
        />

        {formData.role === "admin" && (
          <input
            type="password"
            name="adminPin"
            placeholder="Enter Admin's Special PIN"
            onChange={handleChange}
            required
            className="w-full mb-6 p-3 border-2 rounded-xl bg-amber-100 border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-stone-500 text-stone-800"
          />
        )}

        <button
          type="submit"
          className="w-full bg-amber-700 text-white py-3 mt-2 rounded-full font-bold text-lg hover:bg-amber-800 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-400"
        >
         Create Account
        </button>

        <p className="text-sm text-center mt-6 text-gray-600">
          Already part of our sweet community?{" "}
          <span
            className="text-amber-700 font-bold cursor-pointer hover:underline"
            onClick={() => router.push("/login")}
          >
            Login here
          </span>
        </p>
      </form>
    </main>
  );
}
