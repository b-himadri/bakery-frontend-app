// frontend/src/app/checkout/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCart, CartProvider } from '@/context/CartContext'; // To get cart data and clear it

// Define Address interface for type safety
interface Address {
  _id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: string;
  isDefault: boolean;
}

function CheckoutPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const { cart, loading: cartLoading, error: cartError, fetchCart } = useCart();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online' | 'QR'>('COD'); // Default to COD

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderMessage, setOrderMessage] = useState({ text: '', type: '' });

  // --- Authentication Gate ---
  useEffect(() => {
    if (!user && !userLoading) {
      router.push('/login?redirect=/checkout'); // Redirect to login, then back to checkout
    }
  }, [user, userLoading, router]);

  // --- Fetch Addresses ---
  useEffect(() => {
    const fetchUserAddresses = async () => {
      setAddressesLoading(true);
      setAddressesError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No authentication token found.");
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch addresses.");
        }
        const data = await res.json();
        setAddresses(data.addresses);
        // Automatically select the default address if available
        const defaultAddress = data.addresses.find((addr: Address) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else if (data.addresses.length > 0) {
          setSelectedAddressId(data.addresses[0]._id); // Select first if no default
        }
      } catch (err: any) {
        console.error("Error fetching addresses:", err);
        setAddressesError(err.message || "Failed to load addresses.");
      } finally {
        setAddressesLoading(false);
      }
    };

    if (user && !userLoading) { // Fetch addresses only if user is logged in
      fetchUserAddresses();
    }
  }, [user, userLoading]);

  // --- Handle Order Placement ---
  const handlePlaceOrder = async () => {
    if (!cart || cart.items.length === 0) {
      setOrderMessage({ text: "Your cart is empty!", type: "error" });
      return;
    }
    if (!selectedAddressId) {
      setOrderMessage({ text: "Please select a delivery address.", type: "error" });
      return;
    }

    setIsPlacingOrder(true);
    setOrderMessage({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          addressId: selectedAddressId,
          paymentMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to place order.");
      }

      setOrderMessage({ text: "Order placed successfully!", type: "success" });
      await fetchCart(); // Clear cart after successful order
      // Redirect to a confirmation page or order history
      router.push(`/order-confirmation/${data.order._id}`); // Assuming backend returns order ID

    } catch (err: any) {
      console.error("Error placing order:", err);
      setOrderMessage({ text: err.message || "An error occurred while placing your order.", type: "error" });
    } finally {
      setIsPlacingOrder(false);
    }
  };

 if (userLoading || cartLoading || addressesLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 font-inter">
        <svg className="animate-spin h-10 w-10 text-amber-700 mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-600">Loading checkout details...</p>
      </div>
    );
  }

  // If user is not logged in after loading, redirect them
  if (!user) {
    return null; // This will trigger the redirect in the useEffect hook
  }

  // --- Handle Empty Cart Scenario (This check runs ONLY AFTER all loading is complete) ---
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 font-inter p-4">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">Your Cart is Empty</h2>
        <p className="text-gray-700 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-amber-700 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors shadow-lg"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  const subtotal = cart.items.reduce((total, item) => total + item.productId.price * item.quantity, 0);
  const deliveryFee = 50; // Example fixed delivery fee
  const totalAmount = subtotal + deliveryFee;


  return (
    <div className="min-h-screen bg-neutral-50 font-inter p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-amber-800 mb-6 text-center">Checkout</h1>

        {orderMessage.text && (
          <div className={`mb-6 p-4 rounded-lg text-center font-semibold ${orderMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {orderMessage.text}
          </div>
        )}

        {/* --- Order Summary --- */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Order Summary</h2>
          <div className="space-y-4">
            {cart.items.map((item) => (
              <div key={item._id} className="flex justify-between items-center pb-2 border-b border-neutral-100 last:border-b-0">
                <div className="flex items-center gap-4">
                  <img src={item.productId.imageUrl || 'https://placehold.co/50x50?text=No+Image'} alt={item.productId.name} className="w-12 h-12 object-cover rounded-md" />
                  <div>
                    <p className="font-semibold text-gray-800">{item.productId.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800">Rs. {(item.productId.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-200 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Delivery Fee:</span>
              <span>Rs. {deliveryFee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-amber-900 pt-2 border-t mt-2">
              <span>Total:</span>
              <span>Rs. {totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </section>

        {/* --- Delivery Address --- */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Delivery Address</h2>
          {addressesError && <p className="text-red-500 mb-4">{addressesError}</p>}
          {addresses.length === 0 ? (
            <p className="text-gray-600">No addresses found. Please add one in your <span onClick={() => router.push('/account?section=addresses')} className="text-amber-700 cursor-pointer underline">account settings</span>.</p>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <label key={address._id} className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
                  <input
                    type="radio"
                    name="deliveryAddress"
                    value={address._id}
                    checked={selectedAddressId === address._id}
                    onChange={() => setSelectedAddressId(address._id)}
                    className="mt-1 mr-3"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}{address.city}, {address.state} - {address.postalCode}</p>
                    <p className="text-sm text-gray-600">{address.country} ({address.addressType})</p>
                    {address.isDefault && <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full mt-1 inline-block">Default</span>}
                  </div>
                </label>
              ))}
            </div>
          )}
          {/* Option to add a new address during checkout (simplified) */}
         <button
            onClick={() => router.push('/account?section=addresses&from=checkout')} // <-- ADDED &from=checkout
            className="mt-4 bg-amber-700 text-white px-4 py-2 rounded-md hover:bg-amber-600 transition-colors text-sm"
          >
            Manage Addresses
          </button>
        </section>

        {/* --- Payment Method --- */}
        <section className="mb-8 border-b pb-6">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Payment Method</h2>
          <div className="space-y-4">
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="paymentMethod"
                value="COD"
                checked={paymentMethod === 'COD'}
                onChange={() => setPaymentMethod('COD')}
                className="mr-3"
              />
              <span className="font-semibold text-gray-800">Cash on Delivery (COD)</span>
            </label>
            <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-neutral-50">
              <input
                type="radio"
                name="paymentMethod"
                value="Online"
                checked={paymentMethod === 'Online'}
                onChange={() => setPaymentMethod('Online')}
                className="mr-3"
              />
              <span className="font-semibold text-gray-800">Online Payment (Cards, NetBanking, UPI)</span>
            </label>
            {/* You could add a specific QR option if your payment gateway requires it differently */}
            {paymentMethod === 'Online' && (
              <div className="mt-4 p-4 bg-neutral-100 rounded-lg text-gray-700">
                <p>You will be redirected to a secure payment gateway to complete your purchase.</p>
                {/* Placeholder for QR code if online payment implies UPI QR */}
                {/* <img src="https://via.placeholder.com/150?text=Scan+QR" alt="QR Code" className="mx-auto mt-4" /> */}
              </div>
            )}
          </div>
        </section>

        {/* --- Place Order Button --- */}
        <div className="text-center">
          <button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !selectedAddressId || !cart || cart.items.length === 0}
            className="bg-amber-700 text-white px-8 py-4 rounded-full font-bold text-xl hover:bg-amber-800 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlacingOrder ? 'Placing Order...' : `Place Order - Rs. ${totalAmount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function CheckoutPageWrapper() {
  return (
    <CartProvider>
      <CheckoutPage />
    </CartProvider>
  );
}