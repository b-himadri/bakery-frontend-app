// frontend/src/app/account/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
import CartSidebar from "@/components/CartSidebar"; 
import Header from "../../components/Header";

function AccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: userLoading, setUser } = useUser(); // Ensure setUser is destructured
  //   const { fetchCart } = useCart();

  const currentSection = searchParams.get("section") || "profile";
  const redirectTo = searchParams.get('from'); // <-- NEW: Read the 'from' query parameter

  // --- NEW STATES FOR PROFILE EDITING ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profileEmail, setProfileEmail] = useState(user?.email || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState({ text: "", type: "" });
  // --- END NEW STATES ---

  // --- NEW STATES FOR ADDRESS MANAGEMENT ---
// These new states need to be added directly inside the AccountPage component,
// alongside your existing profile editing states (isEditingProfile, profileName, etc.)
// For example, right after the profile editing states, or within a new dedicated section.
const [addresses, setAddresses] = useState<any[]>([]); // To store fetched addresses
const [addressLoading, setAddressLoading] = useState(true);
const [addressError, setAddressError] = useState<string | null>(null);
const [showAddressForm, setShowAddressForm] = useState(false); // To show/hide add/edit form
const [editingAddress, setEditingAddress] = useState<any | null>(null); // To store address being edited
const [addressFormData, setAddressFormData] = useState({ // Form fields
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India', // Default country
  addressType: 'shipping', // Default address type
  isDefault: false,
});
const [addressMessage, setAddressMessage] = useState({ text: '', type: '' });
// --- END NEW STATES ---

// --- NEW FUNCTIONS FOR ADDRESS MANAGEMENT ---
// These functions should also be added inside the AccountPage component.


// --- NEW STATES FOR ORDER MANAGEMENT ---
const [orders, setOrders] = useState<any[]>([]); // To store fetched orders
const [ordersLoading, setOrdersLoading] = useState(false); // Start as false, fetch on demand
const [ordersError, setOrdersError] = useState<string | null>(null);
// --- END NEW STATES ---

const showAddressMessage = (text: string, type: string) => {
  setAddressMessage({ text, type });
  setTimeout(() => setAddressMessage({ text: '', type: '' }), 4000);
};

// --- NEW FUNCTION: fetchOrders ---
const fetchOrders = async () => {
  setOrdersLoading(true);
  setOrdersError(null);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setOrdersError("Not authenticated to fetch orders.");
      router.push('/login');
      return;
    }
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || "Failed to fetch orders.");
    }
    const data = await res.json();
    setOrders(data.orders);
  } catch (err: any) {
    console.error("Error fetching orders:", err);
    setOrdersError(err.message || "Failed to load orders.");
  } finally {
    setOrdersLoading(false);
  }
};
// --- END NEW FUNCTION ---

const fetchAddresses = async () => {
  setAddressLoading(true);
  setAddressError(null);
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setAddressError("Not authenticated to fetch addresses.");
      router.push('/login');
      return;
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
  } catch (err: any) {
    console.error("Error fetching addresses:", err);
    setAddressError(err.message || "Failed to load addresses.");
  } finally {
    setAddressLoading(false);
  }
};

// --- NEW useEffect: Fetch orders when 'orders' section is active ---
useEffect(() => {
  if (user && !userLoading && currentSection === 'orders') {
    fetchOrders();
  }
}, [user, userLoading, currentSection]); // Re-fetch if user/section changes
// --- END NEW useEffect ---

useEffect(() => {
  if (user && !userLoading) {
    fetchAddresses(); // Fetch addresses when user is loaded
  }
}, [user, userLoading]); // Re-fetch addresses if user changes

const handleAddressFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  const { name, value, type, checked } = e.target as HTMLInputElement;
  setAddressFormData(prev => ({
    ...prev,
    [name]: type === 'checkbox' ? checked : value,
  }));
};

const handleAddressSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setAddressError(null);

  if (!addressFormData.addressLine1 || !addressFormData.city || !addressFormData.state || !addressFormData.postalCode || !addressFormData.country) {
    showAddressMessage("Please fill all required address fields.", "error");
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const method = editingAddress ? 'PATCH' : 'POST';
    const url = editingAddress ? `${process.env.NEXT_PUBLIC_API_URL}/api/addresses/${editingAddress._id}` : '${process.env.NEXT_PUBLIC_API_URL}/api/addresses';

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(addressFormData),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || `Failed to ${editingAddress ? 'update' : 'add'} address.`);
    }

    showAddressMessage(`Address ${editingAddress ? 'updated' : 'added'} successfully!`, 'success');
    setShowAddressForm(false);
    setEditingAddress(null);
    setAddressFormData({ // Reset form
      addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', addressType: 'shipping', isDefault: false,
    });
    fetchAddresses(); // Re-fetch addresses to update list
     // --- NEW: Conditional Redirection ---
      if (redirectTo === 'checkout') {
        router.push('/checkout'); // Redirect back to checkout page
      }
      // --- END NEW ---

  } catch (err: any) {
    console.error(`Error ${editingAddress ? 'updating' : 'adding'} address:`, err);
    showAddressMessage(err.message || `Failed to ${editingAddress ? 'update' : 'add'} address.`, 'error');
  }
};

const startEditAddress = (address: any) => {
  setEditingAddress(address);
  setAddressFormData({
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    addressType: address.addressType,
    isDefault: address.isDefault,
  });
  setShowAddressForm(true); // Open the form for editing
};

const handleDeleteAddress = async (addressId: string) => {
  if (!window.confirm("Are you sure you want to delete this address?")) return;
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses/${addressId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to delete address.");
    }
    showAddressMessage("Address deleted successfully!", 'success');
    fetchAddresses(); // Re-fetch addresses
  } catch (err: any) {
    console.error("Error deleting address:", err);
    showAddressMessage(err.message || "Failed to delete address.", 'error');
  }
};

const handleSetDefaultAddress = async (addressId: string) => {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/addresses/${addressId}/set-default`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to set default address.");
    }
    showAddressMessage("Address set as default!", 'success');
    fetchAddresses(); // Re-fetch addresses to update default status
  } catch (err: any) {
    console.error("Error setting default address:", err);
    showAddressMessage(err.message || "Failed to set default address.", 'error');
  }
};

  // Effect to update form fields if user data changes (e.g., on initial load or after update)
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
    }
  }, [user]);

  // Helper for showing messages
  const showProfileMessage = (text: string, type: string) => {
    setProfileMessage({ text, type });
    setTimeout(() => setProfileMessage({ text: "", type: "" }), 4000); // Clear message after 4 seconds
  };

  // --- NEW: handleProfileSave function ---
  const handleProfileSave = async () => {
    // Client-side validation
    if (!profileName || !profileEmail) {
      showProfileMessage("Name and Email cannot be empty.", "error");
      return;
    }

    // Password validation only if any password field is touched
    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        showProfileMessage(
          "Please fill in old, new, and confirm passwords to change password.",
          "error"
        );
        return;
      }
      if (newPassword !== confirmPassword) {
        showProfileMessage(
          "New password and confirm password do not match.",
          "error"
        );
        return;
      }
      if (newPassword.length < 6) {
        showProfileMessage(
          "New password must be at least 6 characters long.",
          "error"
        );
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showProfileMessage("You must be logged in to update profile.", "error");
        router.push("/login");
        return;
      }

      const updateData: {
        name?: string;
        email?: string;
        oldPassword?: string;
        newPassword?: string;
      } = {};

      // Only include fields in updateData if they have actually changed or if it's a password change
      if (profileName !== user?.name) updateData.name = profileName;
      if (profileEmail !== user?.email) updateData.email = profileEmail;
      if (newPassword) {
        // Only send password fields if a new password is provided
        updateData.oldPassword = oldPassword;
        updateData.newPassword = newPassword;
      }

      if (Object.keys(updateData).length === 0) {
        showProfileMessage("No changes to save.", "info");
        setIsEditingProfile(false);
        return;
      }

      // --- Backend Endpoint Needed: PATCH /api/auth/profile ---
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include", // Important for session cookie
        body: JSON.stringify(updateData),
      });

      const data = await res.json();

      if (!res.ok) {
        showProfileMessage(
          data.message || "Failed to update profile.",
          "error"
        );
      } else {
        showProfileMessage("Profile updated successfully!", "success");
        // Update UserContext if name or email changed
        if (data.user) {
          setUser(data.user); // Assuming backend sends back updated user data
        }
        setIsEditingProfile(false);
        // Clear password fields after successful update
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      showProfileMessage("An error occurred during profile update.", "error");
    }
  };
  // --- END handleProfileSave function ---

  // --- handleLogout function (already existed, just confirming context import) ---
  const handleLogout = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Backend logout failed:", await res.json());
        alert("Logout failed. Please try again.");
        return;
      }

      localStorage.removeItem("token");
      setUser(null);
      //   await fetchCart();
      router.push("/dashboard"); // Redirect to login, not dashboard
    } catch (error) {
      console.error("Error during logout:", error);
      alert("An error occurred during logout.");
    }
  };
  // --- END handleLogout ---

  // Redirect to login if not logged in
  useEffect(() => {
    if (!user && !userLoading) {
      router.push("/dashboard"); // Redirect to login if not logged in
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 font-inter">
        <p className="text-gray-600">Loading user data...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // --- MODIFIED: renderSectionContent function ---
  const renderSectionContent = () => {
    switch (currentSection) {
      case "profile":
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-amber-800 mb-4">
              Your Profile
            </h2>

            {profileMessage.text && (
              <div
                className={`mb-4 p-3 rounded-md text-sm ${
                  profileMessage.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            {isEditingProfile ? (
              // Edit mode
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="profileName"
                    className="block text-gray-700 text-sm font-bold mb-1"
                  >
                    Name:
                  </label>
                  <input
                    type="text"
                    id="profileName"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profileEmail"
                    className="block text-gray-700 text-sm font-bold mb-1"
                  >
                    Email:
                  </label>
                  <input
                    type="email"
                    id="profileEmail"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>

                <div className="border-t border-neutral-200 pt-4 mt-4">
                  <h3 className="text-lg font-bold text-amber-800 mb-2">
                    Change Password
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Leave blank if you {"Don't forget"} want to change password.
                  </p>
                  <div>
                    <label
                      htmlFor="oldPassword"
                      className="block text-gray-700 text-sm font-bold mb-1"
                    >
                      Old Password:
                    </label>
                    <input
                      type="password"
                      id="oldPassword"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <div className="mt-2">
                    <label
                      htmlFor="newPassword"
                      className="block text-gray-700 text-sm font-bold mb-1"
                    >
                      New Password:
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <div className="mt-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-gray-700 text-sm font-bold mb-1"
                    >
                      Confirm New Password:
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => {
                      setIsEditingProfile(false);
                      // Reset fields to current user data on cancel
                      setProfileName(user?.name || "");
                      setProfileEmail(user?.email || "");
                      setOldPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setProfileMessage({ text: "", type: "" });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // View mode
              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>Name:</strong> {user.name}
                </p>
                <p className="text-gray-700">
                  <strong>Email:</strong> {user.email}
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'orders':
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-amber-800 mb-4">Your Orders</h2>
            {ordersLoading ? (
              <p className="text-center text-gray-600">Loading orders...</p>
            ) : ordersError ? (
              <p className="text-center text-red-500">{ordersError}</p>
            ) : orders.length === 0 ? (
              <p className="text-center text-gray-600">You have no orders yet.</p>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 border rounded-lg bg-white shadow-sm">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-semibold text-lg text-amber-800">Order #{order._id.substring(0, 8)}...</h3>
                      <span className={`text-sm px-2 py-1 rounded-full capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-gray-700">Total: Rs. {order.totalAmount.toFixed(2)}</p>
                    <p className="text-gray-600 text-sm">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <p><strong>Items:</strong></p>
                      <ul className="list-disc list-inside ml-4">
                        {order.items.map((item: any) => ( // Using any here, consider defining OrderItem interface if not already
                          <li key={item._id}>{item.name} x {item.quantity} (Rs. {item.price.toFixed(2)})</li>
                        ))}
                      </ul>
                    </div>
                    <button
                      onClick={() => router.push(`/order-confirmation/${order._id}`)}
                      className="mt-3 px-3 py-1 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200 text-sm"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'addresses':
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-amber-800 mb-4">Your Addresses</h2>
          
          {addressMessage.text && (
            <div className={`mb-4 p-3 rounded-md text-sm ${addressMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {addressMessage.text}
            </div>
          )}

          <button
            onClick={() => { setShowAddressForm(true); setEditingAddress(null); setAddressFormData({ addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', addressType: 'shipping', isDefault: false }); }}
            className="mb-6 px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800 transition-colors"
          >
            Add New Address
          </button>

          {showAddressForm && (
            <form onSubmit={handleAddressSubmit} className="space-y-4 mb-6 p-4 border rounded-lg bg-neutral-50">
              <h3 className="text-xl font-bold text-amber-800 mb-2">{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
              
              <div>
                <label htmlFor="addressLine1" className="block text-gray-700 text-sm font-bold mb-1">Address Line 1:</label>
                <input type="text" id="addressLine1" name="addressLine1" value={addressFormData.addressLine1} onChange={handleAddressFormChange} required className="w-full p-2 border rounded-md" />
              </div>
              <div>
                <label htmlFor="addressLine2" className="block text-gray-700 text-sm font-bold mb-1">Address Line 2 (Optional):</label>
                <input type="text" id="addressLine2" name="addressLine2" value={addressFormData.addressLine2} onChange={handleAddressFormChange} className="w-full p-2 border rounded-md" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-gray-700 text-sm font-bold mb-1">City:</label>
                  <input type="text" id="city" name="city" value={addressFormData.city} onChange={handleAddressFormChange} required className="w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="state" className="block text-gray-700 text-sm font-bold mb-1">State:</label>
                  <input type="text" id="state" name="state" value={addressFormData.state} onChange={handleAddressFormChange} required className="w-full p-2 border rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="postalCode" className="block text-gray-700 text-sm font-bold mb-1">Postal Code:</label>
                  <input type="text" id="postalCode" name="postalCode" value={addressFormData.postalCode} onChange={handleAddressFormChange} required className="w-full p-2 border rounded-md" />
                </div>
                <div>
                  <label htmlFor="country" className="block text-gray-700 text-sm font-bold mb-1">Country:</label>
                  <select id="country" name="country" value={addressFormData.country} onChange={handleAddressFormChange} required className="w-full p-2 border rounded-md">
                    <option value="India">India</option>
                    {/* Add more countries as needed */}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="addressType" className="block text-gray-700 text-sm font-bold mb-1">Address Type:</label>
                <select id="addressType" name="addressType" value={addressFormData.addressType} onChange={handleAddressFormChange} className="w-full p-2 border rounded-md">
                  <option value="shipping">Shipping</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="isDefault" name="isDefault" checked={addressFormData.isDefault} onChange={handleAddressFormChange} className="mr-2" />
                <label htmlFor="isDefault" className="text-gray-700 text-sm">Set as Default Address</label>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button type="button" onClick={() => { setShowAddressForm(false); setEditingAddress(null); setAddressFormData({ addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India', addressType: 'shipping', isDefault: false }); }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-amber-700 text-white rounded-md hover:bg-amber-800">{editingAddress ? 'Update Address' : 'Add Address'}</button>
              </div>
            </form>
          )}

          {addressLoading ? (
            <p className="text-center text-gray-600">Loading addresses...</p>
          ) : addressError ? (
            <p className="text-center text-red-500">{addressError}</p>
          ) : addresses.length === 0 ? (
            <p className="text-center text-gray-600">No addresses saved yet.</p>
          ) : (
            <div className="space-y-4">
              {addresses.map((address) => (
                <div key={address._id} className="p-4 border rounded-lg bg-white shadow-sm relative">
                  {address.isDefault && (
                    <span className="absolute top-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Default</span>
                  )}
                  <p className="font-semibold text-gray-800">{address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}{address.city}, {address.state} - {address.postalCode}</p>
                  <p className="text-gray-600 text-sm">{address.country} ({address.addressType})</p>
                  <div className="mt-3 flex space-x-2">
                    <button onClick={() => startEditAddress(address)} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm">Edit</button>
                    {!address.isDefault && ( // Cannot delete default address directly
                      <button onClick={() => handleDeleteAddress(address._id)} className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm">Delete</button>
                    )}
                    {!address.isDefault && (
                      <button onClick={() => handleSetDefaultAddress(address._id)} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm">Set as Default</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      default:
        return (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-amber-800 mb-4">
              Welcome to My Account!
            </h2>
            <p className="text-gray-700">Select a section from the left.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-inter">
      <Header></Header>

      <main className="flex flex-grow container mx-auto p-4 sm:p-6 lg:p-8 gap-6">
        <aside className="w-full sm:w-64 bg-white p-6 rounded-xl shadow-lg flex flex-col h-full sticky top-4">
          <nav className="space-y-2">
            <button
              onClick={() => router.push("/account?section=profile")}
              className={`w-full text-left px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                currentSection === "profile"
                  ? "bg-amber-100 text-amber-800"
                  : "text-gray-700 hover:bg-neutral-100"
              }`}
            >
              Your Profile
            </button>
            <button
              onClick={() => router.push("/account?section=orders")}
              className={`w-full text-left px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                currentSection === "orders"
                  ? "bg-amber-100 text-amber-800"
                  : "text-gray-700 hover:bg-neutral-100"
              }`}
            >
              Your Orders
            </button>
            <button
              onClick={() => router.push("/account?section=addresses")}
              className={`w-full text-left px-4 py-2 rounded-lg text-lg font-medium transition-colors ${
                currentSection === "addresses"
                  ? "bg-amber-100 text-amber-800"
                  : "text-gray-700 hover:bg-neutral-100"
              }`}
            >
              Your Addresses
            </button>
          </nav>
        </aside>

        <section className="flex-grow w-full max-w-3xl">
          {renderSectionContent()}
        </section>
      </main>

      <div className="py-6 flex justify-center bg-neutral-50">
        <button
          onClick={handleLogout}
          className="bg-amber-700 text-white px-8 py-3 rounded-full hover:bg-amber-900 transition-colors shadow-lg text-lg font-semibold"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

// Wrap the DashboardContent with CartProvider
export default function AccountPageWrapper() {
  return (
    <CartProvider>
      <AccountPage />
      <CartSidebar />
    </CartProvider>
  );
}
