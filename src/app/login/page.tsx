//frontend/src/app/login/page.tsx
"use client";

import React, { useState, useEffect} from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";

export default function LoginPage() {
  const router = useRouter();
 const { setUser } = useUser();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState({
    text: "",
    type: "",
    isVisible: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setUser(data.user); // ✅ Set context to prevent dashboard misfire
        if (data.user?.role === "admin") {
          router.replace("/admin-dashboard");
        } else {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
      });
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showMessage = (text: string, type: string) => {
    setMessage({ text, type, isVisible: true });
    setTimeout(() => {
      setMessage((prev) => ({ ...prev, isVisible: false }));
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-type": "application/json" },
        body: JSON.stringify(formData),
        credentials: 'include', // <-- ADD THIS LINE
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Login failed.", "error");
      } else {
        // Save token + user role
        localStorage.setItem("token", data.token);
        setUser(data.user); // ⬅️ Update global user context

        showMessage("Login Successful!", "success");
        console.log("Logged in user:", data?.user);
        console.log("Role is:", data?.user?.role);

        setTimeout(async () => { // Make the callback async
          if (data.user.role === "admin") {
            router.push("/admin-dashboard");
          } else {
            router.push("/dashboard");
          }
        }, 2000);
      }
    } catch (err) {
      console.error("Login error:", err);
      showMessage("Something went wrong. Please try again.", "error");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 bg-amber-50 font-inter">
      {message.isVisible && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-50 transition-all duration-300
          ${
            message.type === "success"
              ? "bg-pink-100 text-pink-800"
              : "bg-red-200 text-red-800"
          }`}
        >
          <p className="font-semibold text-sm">{message.text}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-amber-50 border border-neutral-200 p-8 rounded-3xl shadow-xl w-full max-w-md hover:scale-[1.01] transition-transform duration-300"
        style={{ boxShadow: "0 15px 30px rgba(101, 67, 33, 0.2)" }}
      >
        <h1 className="text-3xl font-extrabold mb-6 text-amber-800 text-center drop-shadow-sm">
          Login
        </h1>

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
          placeholder="Your Password"
          onChange={handleChange}
          required
          className="w-full mb-6 p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder-stone-500 text-stone-800"
        />

        <button
          type="submit"
          className="w-full bg-amber-700 text-white py-3 mt-2 rounded-full font-bold text-lg hover:bg-amber-800 hover:scale-105 transition-transform duration-300 shadow-lg"
        >
          Login
        </button>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <span
            onClick={() => router.push("/signup")}
            className="text-amber-700 font-bold cursor-pointer hover:underline transition-colors duration-200"
          >
            Sign up here
          </span>
        </p>
      </form>
    </main>
  );
}
