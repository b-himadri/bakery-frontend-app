// frontend/src/app/order-confirmation/[id]/page.tsx
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation'; // <-- Import useParams
import { useUser } from '@/context/UserContext';

// Define interfaces for type safety based on your Order model
interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  _id: string; // The item ID within the order
}

interface DeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType?: string;
}

interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: 'COD' | 'Online' | 'QR';
  status: 'pending' | 'pending_payment' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function OrderConfirmationPage() {
  const router = useRouter();
  const params = useParams(); // <-- Get dynamic route parameters
  const orderId = params.id as string; // Cast 'id' from params to string

  const { user, loading: userLoading } = useUser();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Authentication Gate ---
  useEffect(() => {
    if (!user && !userLoading) {
      // If not logged in, redirect to login page.
      // We don't have a direct way to return to this specific order after login,
      // so we might just send them to dashboard or order history.
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // --- Fetch Order Details ---
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !user) { // Only fetch if orderId and user are available
        setLoading(false);
        if (!orderId) setError("No order ID provided.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No authentication token found.");
        }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to fetch order details.");
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        console.error("Error fetching order:", err);
        setError(err.message || "Failed to load order details.");
      } finally {
        setLoading(false);
      }
    };

    if (user && !userLoading) { // Fetch only when user context is loaded and valid
      fetchOrderDetails();
    }
  }, [orderId, user, userLoading]); // Re-fetch if orderId or user/userLoading changes

  if (loading || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 font-inter">
        <p className="text-gray-600">Loading order confirmation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 font-inter p-4">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-amber-700 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors shadow-lg"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 font-inter p-4">
        <p className="text-gray-600 mb-4">Order not found or no order ID provided.</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-amber-700 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors shadow-lg"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 font-inter p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-amber-800 mb-4 text-center">Order Confirmation</h1>
        <p className="text-center text-gray-600 mb-8">Thank you for your purchase!</p>

        <section className="mb-8 p-6 border rounded-lg bg-neutral-50">
          <h2 className="text-xl font-bold text-amber-800 mb-3">Order #{order._id.substring(0, 8)}...</h2>
          <p className="text-gray-700 mb-2"><strong>Status:</strong> <span className="capitalize">{order.status.replace(/_/g, ' ')}</span></p>
          <p className="text-gray-700"><strong>Payment Method:</strong> {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</p>
          <p className="text-gray-700"><strong>Total Amount:</strong> Rs. {order.totalAmount.toFixed(2)}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Items Ordered</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item._id} className="flex justify-between items-center pb-2 border-b border-neutral-100 last:border-b-0">
                <div className="flex items-center gap-4">
                  <img src={item.imageUrl || 'https://placehold.co/50x50?text=No+Image'} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                  <div>
                    <p className="font-semibold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-800">Rs. {(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Delivery Details</h2>
          <div className="p-4 border rounded-lg bg-neutral-50">
            <p className="font-semibold text-gray-800">{order.deliveryAddress.addressLine1}, {order.deliveryAddress.addressLine2 && `${order.deliveryAddress.addressLine2}, `}{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.postalCode}</p>
            <p className="text-gray-600 text-sm">{order.deliveryAddress.country} ({order.deliveryAddress.addressType || 'N/A'})</p>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="bg-amber-700 text-white px-6 py-3 rounded-full hover:bg-amber-800 transition-colors shadow-lg"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => router.push('/account?section=orders')}
            className="bg-neutral-200 text-gray-700 px-6 py-3 rounded-full hover:bg-neutral-300 transition-colors shadow-lg"
          >
            View My Orders
          </button>
        </div>
      </div>
    </div>
  );
}