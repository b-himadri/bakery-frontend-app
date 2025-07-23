// frontend/src/components/Header.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { user, loading: userLoading, setUser } = useUser();
  const { cart, loading: cartLoading, setIsCartOpen } = useCart();
  const router = useRouter();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const totalCartQuantity =
    cart?.items.reduce((total, item) => total + item.quantity, 0) || 0;

  const handleLogout = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Backend logout failed:", await res.json());
        alert("Logout failed from header. Please try again.");
        return;
      }

      localStorage.removeItem("token");
      setUser(null);
      setIsDropdownOpen(false);
      router.push("/dashboard");
    } catch (error) {
      console.error("Error during logout from header:", error);
      alert("An error occurred during logout from header.");
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  if (userLoading || cartLoading) {
    return (
      <header className="w-full bg-white border-b border-neutral-200 shadow-sm p-4 flex justify-center items-center sticky top-0 z-50 font-inter h-16">
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-amber-700"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="text-neutral-700">Loading data...</p>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full bg-white border-b border-neutral-200 shadow-sm p-4 flex justify-between items-center sticky top-0 z-50 font-inter">
      <div className="flex items-center gap-4 sm:gap-6 ">
        <div
          className="text-amber-800 text-3xl font-bold flex items-center cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <img
            src="/cupcake-logo.png"
            alt="Melt & Whirl Bakery Logo"
            style={{ width: "80px", height: "80px" }}
          />
          <span className="hidden sm:block text-amber-800 text-5xl ">
            Melt & Whirl
          </span>{" "}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <div
              className="flex items-center gap-2 group cursor-pointer"
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              <svg
                className="w-6 h-6 text-amber-700 hover:text-amber-900 transition-colors"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
              <p className="text-sm text-neutral-700 hidden md:block whitespace-nowrap">
                Welcome, {user.name ? user.name : "Guest"}
              </p>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 border border-neutral-200">
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/account?section=profile");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-neutral-100"
                >
                  Your Profile
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/account?section=orders");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-neutral-100"
                >
                  Your Orders
                </button>
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    router.push("/account?section=addresses");
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-neutral-100"
                >
                  Your Addresses
                </button>
                <div className="border-t border-neutral-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-pink-600 hover:bg-red-50 hover:text-red-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="bg-amber-700 text-white px-4 py-2 rounded-full hover:bg-amber-900 transition-all text-lg shadow-md whitespace-nowrap font-semibold"
          >
            Login to Order
          </button>
        )}
        <div
          className="relative group cursor-pointer"
          onClick={() => setIsCartOpen(true)}
        >
          <svg
            // Changed SVG size for responsiveness and slightly smaller default
            className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 hover:text-amber-900 transition-colors"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zm10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2zm-8.7-17.5L3 7v10h14V7l-1.7-8.5c-.1-.4-.5-.5-.8-.5H4.5c-.3 0-.7.1-.8.5zM15 15H5V8h10v7z" />
          </svg>
          {totalCartQuantity > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-pink-400 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-semibold">
              {totalCartQuantity}
            </span>
          )}
          <span className="absolute top-full left-1/2 -translate-x-1/2 mt-0.5 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block">
            My Cart
          </span>
        </div>
      </div>
    </header>
  );
}
