// frontend/src/components/CartSidebar.tsx
"use client";

import React from "react";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";

export default function CartSidebar() {
  const {
    cart,
    loading,
    error,
    updateItemQuantity,
    removeItem,
    isCartOpen,
    setIsCartOpen,
  } = useCart();
    const router = useRouter(); 

  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce(
      (total, item) => total + item.productId.price * item.quantity,
      0
    );
  };

   const handleProceedToCheckout = () => { // <-- NEW FUNCTION
    setIsCartOpen(false); // Close the sidebar
    router.push("/checkout"); // Navigate to the checkout page
  };

   return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
          onClick={() => setIsCartOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
          ${isCartOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex justify-between items-center p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-amber-800">Your Cart</h2>
          <button
            onClick={() => setIsCartOpen(false)}
            className="text-gray-500 hover:text-gray-700 text-3xl font-light"
          >
            &times;
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-grow h-[calc(100vh-240px)]">
          {" "}
          {/* Adjusted height to account for header/footer */}
          {loading && (
            <p className="text-center text-gray-600 mt-8">Loading cart...</p>
          )}
          {error && <p className="text-center text-red-500 mt-8">{error}</p>}
          {!loading && !error && (!cart || cart.items.length === 0) ? (
            <p className="text-center text-gray-600 mt-8">
              Your cart is empty.
            </p>
          ) : (
            cart?.items.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between border-b border-neutral-100 py-4"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={
                      item.productId.imageUrl ||
                      "https://placehold.co/80x80/F0E68C/654321?text=No+Image"
                    }
                    alt={item.productId.name}
                    className="w-20 h-20 object-cover rounded-lg shadow-sm"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-amber-700">
                      {item.productId.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Rs. {item.productId.price.toFixed(2)}
                    </p>{" "}
                    {/* Changed here */}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateItemQuantity(item.productId._id, item.quantity - 1)
                    }
                    className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-200 transition-all duration-200 text-sm font-bold"
                  >
                    −
                  </button>
                  <span className="font-bold text-lg text-amber-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateItemQuantity(item.productId._id, item.quantity + 1)
                    }
                    className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-200 transition-all duration-200 text-sm font-bold"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeItem(item.productId._id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    title="Remove item"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zm5 5a1 1 0 10-2 0v1a1 1 0 102 0v-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 border-t border-neutral-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-amber-800">Total:</span>
            <span className="text-2xl font-extrabold text-amber-900">
              Rs. {calculateTotal().toFixed(2)}
            </span>{" "}
            {/* Changed here */}
          </div>
          <button
            onClick={handleProceedToCheckout} // <-- ADDED onClick HANDLER
            className="w-full bg-amber-700 text-white py-3 rounded-full font-bold text-lg hover:bg-amber-800 transition-colors shadow-lg"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </>
  );
}