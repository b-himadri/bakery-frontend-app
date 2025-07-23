// frontend/src/app/admin-dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Header from "@/components/Header";
import axios from "axios";
import { CartProvider } from "@/context/CartContext";

// Define interfaces for type safety (based on your backend models)
interface ProductInput {
  _id?: string; // Optional for new products, required for existing
  name: string;
  price: number | "";
  description: string;
  imageUrl: string;
  stock: number | "";
  category?: string; // Added category based on product model
}

interface AdminInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface OrderItem {
  productId: string; // The actual Product._id
  name: string; // Copied product name
  price: number; // Copied product price at time of order
  quantity: number;
  imageUrl: string; // Copied product image URL
  _id: string; // The order item's own ID
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
  userId: string; // User._id
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  paymentMethod: "COD" | "Online" | "QR";
  status:
    | "pending"
    | "pending_payment"
    | "confirmed"
    | "shipped"
    | "delivered"
    | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// Order Status Options for dropdown
const ORDER_STATUS_OPTIONS = [
  "pending",
  "pending_payment",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

function AdminPage() {
  const { user, loading: userLoading, setUser } = useUser();
  const router = useRouter();

  const [activeSection, setActiveSection] = useState("viewOrders");

  // States for forms
  const [newProduct, setNewProduct] = useState<ProductInput>({
    name: "",
    price: "",
    description: "",
    imageUrl: "",
    stock: "",
    category: "",
  });
  const [newAdmin, setNewAdmin] = useState<AdminInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // States for managing products (for Manage Products section)
  const [products, setProducts] = useState<ProductInput[]>([]); // Using ProductInput interface for simplicity
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductInput | null>(
    null
  ); // Product being edited

  // States for orders (for View Orders section)
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // --- Authentication and Role Check Effect ---
  useEffect(() => {
    if (!userLoading) {
      const token = localStorage.getItem("token");
      if (!token || user?.role !== "admin") {
        router.push("/login");
      } else {
        // Fetch data based on active section once admin is confirmed
        if (activeSection === "viewOrders") {
          fetchOrders();
        } else if (activeSection === "manageProducts") {
          fetchProductsForAdmin();
        }
      }
    }
  }, [user, userLoading, router, activeSection]);

  // --- Logout Handler ---
  const handleLogout = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!res.ok) {
        console.error("Backend logout failed:", await res.json());
        alert("Logout failed. Please try again.");
        return;
      }
      localStorage.removeItem("token");
      setUser(null);
      router.push("/login");
    } catch (error: any) {
      console.error("Error during logout:", error);
      alert("An error occurred during logout.");
    }
  };

  // --- Product Management Functions ---
  const handleProductInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    // For price and stock inputs, convert value to a number or empty string
    const newValue = type === "number" && value !== "" ? Number(value) : value;

    if (editingProduct) {
      setEditingProduct({ ...editingProduct, [name]: newValue });
    } else {
      setNewProduct({ ...newProduct, [name]: newValue });
    }
  };

  // Fetch ALL products for admin view (including out-of-stock)
  const fetchProductsForAdmin = async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      const token = localStorage.getItem("token");
      console.log("Token for product fetch:", token ? "Exists" : "Missing");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/all`,
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }
      );
      const data = await res.json();
      console.log("Product fetch response data:", data); // Log the raw response
      if (!res.ok) throw new Error(data.message || "Failed to fetch products");
      setProducts(data.products);
      console.log("Products set in state:", data.products.length);
    } catch (err: any) {
      console.error("Error fetching all products (frontend):", err);
      setProductsError(err.message || "Failed to load products.");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/products/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        credentials: "include",
        body: JSON.stringify({
          ...newProduct,
          price: Number(newProduct.price),
          stock: Number(newProduct.stock),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      alert("Product added successfully!");
      setNewProduct({
        name: "",
        price: "",
        imageUrl: "",
        stock: "",
        description: "",
        category: "",
      }); // Clear form
      fetchProductsForAdmin(); // Refresh product list after adding
    } catch (err: any) {
      alert(err.message || "Failed to add product");
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?._id) return; // Must have an ID to update

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${editingProduct._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          credentials: "include",
          body: JSON.stringify({
            name: editingProduct.name,
            price: Number(editingProduct.price),
            description: editingProduct.description,
            imageUrl: editingProduct.imageUrl,
            stock: Number(editingProduct.stock),
            category: editingProduct.category,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      alert("Product updated successfully!");
      setEditingProduct(null); // Exit edit mode
      fetchProductsForAdmin(); // Refresh product list
    } catch (err: any) {
      alert(err.message || "Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong");
      alert("Product deleted successfully!");
      fetchProductsForAdmin(); // Refresh product list
    } catch (err: any) {
      alert(err.message || "Failed to delete product");
    }
  };

  // --- Admin Management Functions ---
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newAdmin.password !== newAdmin.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    const adminPin = prompt(
      "Please enter the Admin Access Key to add a new admin:"
    );
    if (!adminPin) {
      alert("Admin Access Key is required to add an admin.");
      return;
    }

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`,
        {
          name: newAdmin.name,
          email: newAdmin.email,
          password: newAdmin.password,
          role: "admin",
          adminPin: adminPin,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (res.status === 201) {
        alert("New admin added successfully!");
        setNewAdmin({ name: "", email: "", password: "", confirmPassword: "" });
      } else {
        alert(res.data.message || "Failed to add admin.");
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An unexpected error occurred.";
      alert(`Error adding admin: ${errorMessage}`);
      console.error("Error adding admin:", error);
    }
  };

  // --- Order Management Functions ---
  const fetchOrders = async () => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Not authenticated.");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/orders`, {
        // This endpoint serves all orders for admin
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch orders.");
      setOrders(data.orders);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setOrdersError(err.message || "Failed to load orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    newStatus: string
  ) => {
    if (
      !window.confirm(
        `Are you sure you want to change status of Order ${orderId.substring(
          0,
          8
        )}... to ${newStatus.replace(/_/g, " ")}?`
      )
    )
      return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ status: newStatus }),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to update order status");
      alert(
        `Order ${orderId.substring(
          0,
          8
        )}... status updated to ${newStatus.replace(/_/g, " ")}!`
      );
      fetchOrders(); // Refresh orders list
    } catch (err: any) {
      alert(err.message || "Failed to update order status");
    }
  };

  // Render loading state if user data is not yet available or not admin
  if (userLoading || !user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col bg-neutral-50 font-inter">
        <Header />
        <main className="flex-grow flex items-center justify-center p-4 pt-16">
          <svg
            className="animate-spin h-10 w-10 text-amber-700 mb-4"
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
          <p className="text-neutral-700 ml-2">Loading admin dashboard...</p>
        </main>
      </div>
    );
  }

  // Helper function to render the active content section
  const renderContent = () => {
    switch (activeSection) {
      case "addProduct":
        return (
          <div
            className="bg-white rounded-3xl shadow-xl p-6 border border-neutral-200 flex flex-col w-full max-w-xl mx-auto" // Added max-w-xl mx-auto for centering
            style={{ boxShadow: "0 10px 20px rgba(101, 67, 33, 0.1)" }}
          >
            <h3 className="text-2xl font-bold text-amber-800 mb-4 text-center">
              Add New Product
            </h3>
            <form onSubmit={handleAddProduct} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={handleProductInputChange}
                name="name" // Added name attribute
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <input
                type="number"
                placeholder="Price"
                value={newProduct.price}
                onChange={handleProductInputChange}
                name="price" // Added name attribute
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={newProduct.imageUrl}
                onChange={handleProductInputChange}
                name="imageUrl" // Added name attribute
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <input
                type="number"
                placeholder="Stock Quantity"
                value={newProduct.stock}
                onChange={handleProductInputChange}
                name="stock" // Added name attribute
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <select
                name="category" // Added name attribute
                value={newProduct.category}
                onChange={handleProductInputChange}
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              >
                <option value="">Select Category</option>
                <option value="cakes">Cakes</option>
                <option value="cupcakes">Cupcakes</option>
                <option value="bread">Bread</option>
                <option value="tarts">Tarts</option>
              </select>
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={handleProductInputChange}
                name="description" // Added name attribute
                rows={3}
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out resize-none"
              ></textarea>
              <button
                type="submit"
                className="bg-amber-800 text-white py-3 rounded-full font-bold text-lg hover:bg-amber-900 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-pink-300 focus:ring-opacity-75"
              >
                Add Product
              </button>
            </form>
          </div>
        );
      case "manageProducts":
        return (
          <div
            className="bg-white rounded-3xl shadow-xl p-6 border border-neutral-200 flex flex-col w-full"
            style={{ boxShadow: "0 10px 20px rgba(101, 67, 33, 0.1)" }}
          >
            <h3 className="text-2xl font-bold text-amber-800 mb-4 text-center">
              Manage Products
            </h3>
            <button
              onClick={fetchProductsForAdmin}
              className="bg-amber-700 text-white py-2 px-4 rounded-full font-bold text-base hover:bg-amber-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-opacity-75 mb-4 self-center"
            >
              {productsLoading ? "Refreshing..." : "Refresh Products List"}
            </button>

            {productsError && (
              <p className="text-red-500 text-center mb-4">{productsError}</p>
            )}

            {productsLoading && !productsError && products.length === 0 ? (
              <p className="text-center text-gray-600">Loading products...</p>
            ) : products.length === 0 && !productsError ? (
              <p className="text-center text-lg text-gray-600">
                No products found.
              </p>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="min-w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                  <thead className="bg-amber-50">
                    <tr>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                        Name
                      </th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                        Price
                      </th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                        Stock
                      </th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                        Category
                      </th>
                      <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr
                        key={product._id}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="py-2 px-4 border-b text-sm text-neutral-800">
                          {editingProduct?._id === product._id ? (
                            <input
                              type="text"
                              name="name"
                              value={editingProduct?.name || ""}
                              onChange={handleProductInputChange}
                              className="w-24 p-1 border rounded"
                            />
                          ) : (
                            product.name
                          )}
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-neutral-800">
                          {editingProduct?._id === product._id ? (
                            <input
                              type="number"
                              name="price"
                              value={editingProduct?.price || ""}
                              onChange={handleProductInputChange}
                              className="w-20 p-1 border rounded"
                            />
                          ) : (
                            `Rs. ${Number(product.price).toFixed(2)}`
                          )}
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-neutral-800">
                          {editingProduct?._id === product._id ? (
                            <input
                              type="number"
                              name="stock"
                              value={editingProduct?.stock || ""}
                              onChange={handleProductInputChange}
                              className="w-20 p-1 border rounded"
                            />
                          ) : (
                            product.stock
                          )}
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-neutral-800 capitalize">
                          {editingProduct?._id === product._id ? (
                            <select
                              name="category"
                              value={editingProduct?.category || ""}
                              onChange={handleProductInputChange}
                              className="w-24 p-1 border rounded"
                            >
                              <option value="">Select Category</option>{" "}
                              {/* Added a default empty option */}
                              <option value="cakes">Cakes</option>
                              <option value="cupcakes">Cupcakes</option>
                              <option value="bread">Bread</option>
                              <option value="tarts">Tarts</option>
                            </select>
                          ) : (
                            product.category
                          )}
                        </td>
                        <td className="py-2 px-4 border-b text-sm text-neutral-800">
                          {editingProduct?._id === product._id ? (
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateProduct}
                                className="bg-green-500 text-white p-1 text-xs rounded hover:bg-green-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingProduct(null)}
                                className="bg-gray-400 text-white p-1 text-xs rounded hover:bg-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setEditingProduct({ ...product })
                                }
                                className="bg-amber-600 text-white p-1 text-md rounded hover:bg-amber-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteProduct(product._id!)
                                }
                                className="bg-amber-500 text-white p-1 text-md rounded hover:bg-amber-900"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      case "viewOrders":
        return (
          <div
            className="bg-white rounded-3xl shadow-xl p-6 border border-neutral-200 flex flex-col w-full"
            style={{ boxShadow: "0 10px 20px rgba(101, 67, 33, 0.1)" }}
          >
            <h3 className="text-2xl font-bold text-amber-800 mb-4 text-center">
              View All Orders
            </h3>
            <div className="flex flex-col items-center text-neutral-700 flex-grow">
              <button
                onClick={fetchOrders}
                className="bg-amber-700 text-white py-2 px-4 rounded-full font-bold text-base hover:bg-amber-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-opacity-75 mb-4"
              >
                {ordersLoading ? "Refreshing..." : "Refresh Orders"}
              </button>

              {ordersError && (
                <p className="text-red-500 text-center mb-4">{ordersError}</p>
              )}

              {ordersLoading && !ordersError && orders.length === 0 ? (
                <p>Loading orders...</p>
              ) : orders.length === 0 && !ordersError ? (
                <p className="text-lg">No orders found yet.</p>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="min-w-full bg-white border border-neutral-200 rounded-lg overflow-hidden">
                    <thead className="bg-amber-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          Order ID
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          User ID
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          Total
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          Payment
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          Status
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          Date
                        </th>
                        <th className="py-2 px-4 border-b text-left text-sm font-semibold text-amber-800">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order._id}
                          className="hover:bg-neutral-50 transition-colors"
                        >
                          <td className="py-2 px-4 border-b text-sm text-neutral-800">
                            {order._id.substring(0, 8)}...
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-neutral-800">
                            {order.userId.substring(0, 8)}...
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-neutral-800">
                            Rs. {order.totalAmount.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-neutral-800">
                            {order.paymentMethod}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-neutral-800 capitalize">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                handleUpdateOrderStatus(
                                  order._id,
                                  e.target.value
                                )
                              }
                              className="p-1 border rounded-md bg-white text-sm"
                            >
                              {ORDER_STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>
                                  {status.replace(/_/g, " ")}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-neutral-800">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4 border-b text-sm text-neutral-800">
                            <button
                              onClick={() =>
                                alert(
                                  `Order ID: ${order._id}\n` +
                                    `User ID: ${order.userId}\n` +
                                    `Total: Rs. ${order.totalAmount.toFixed(
                                      2
                                    )}\n` +
                                    `Payment: ${order.paymentMethod}\n` +
                                    `Status: ${order.status.replace(
                                      /_/g,
                                      " "
                                    )}\n` +
                                    `Placed: ${new Date(
                                      order.createdAt
                                    ).toLocaleDateString()}\n` +
                                    `Delivery Address: ${order.deliveryAddress.addressLine1}, ${order.deliveryAddress.city}, ${order.deliveryAddress.state}, ${order.deliveryAddress.postalCode}, ${order.deliveryAddress.country}\n` +
                                    `Items:\n${order.items
                                      .map(
                                        (i) =>
                                          `- ${i.name} x ${
                                            i.quantity
                                          } (Rs. ${i.price.toFixed(2)})`
                                      )
                                      .join("\n")}`
                                )
                              }
                              className="text-amber-700 hover:underline text-sm"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      case "addAdmin":
        return (
          <div
            className="bg-white rounded-3xl shadow-xl p-6 border border-neutral-200 flex flex-col w-full max-w-xl mx-auto" // Added max-w-xl mx-auto for centering
            style={{ boxShadow: "0 10px 20px rgba(101, 67, 33, 0.1)" }}
          >
            <h3 className="text-2xl font-bold text-amber-800 mb-4 text-center">
              Add New Admin
            </h3>
            <form onSubmit={handleAddAdmin} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Admin Name"
                value={newAdmin.name}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, name: e.target.value })
                }
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <input
                type="email"
                placeholder="Admin Email"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, email: e.target.value })
                }
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <input
                type="password"
                placeholder="Admin Password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <input
                type="password"
                placeholder="Confirm Password"
                value={newAdmin.confirmPassword}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, confirmPassword: e.target.value })
                }
                required
                className="w-full p-3 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-300 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
              />
              <button
                type="submit"
                className="bg-amber-800 text-white py-3 rounded-full font-bold text-lg hover:bg-amber-900 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-amber-300 focus:ring-opacity-75"
              >
                Add Admin
              </button>
            </form>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-inter">
      <Header /> {/* Re-added Header component */}
      <main className="flex-grow p-4 pt-16">
        {" "}
        {/* pt-16 to account for header height */}
        <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
          {" "}
          {/* Responsive flex container */}
          {/* Left Navigation Panel */}
          <div
            className="bg-white rounded-3xl shadow-xl p-6 border border-neutral-200 md:w-60 flex-shrink-0"
            style={{ boxShadow: "0 10px 20px rgba(101, 67, 33, 0.1)" }}
          >
            <h3 className="text-2xl font-bold text-amber-800 mb-4 text-center md:text-left">
              Admin Menu
            </h3>
            <h3 className="text-neutral-700 mb-4 text-center md:text-left">
              Welcome, {user?.name}!
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <button
                  onClick={() => setActiveSection("viewOrders")}
                  className={`w-full text-left py-3 px-4 rounded-xl font-semibold transition-all duration-200 ease-in-out
                    ${
                      activeSection === "viewOrders"
                        ? "bg-amber-100 text-amber-800 shadow-md"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }
                  `}
                >
                  View Orders
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("addProduct")}
                  className={`w-full text-left py-3 px-4 rounded-xl font-semibold transition-all duration-200 ease-in-out
                    ${
                      activeSection === "addProduct"
                        ? "bg-amber-100 text-amber-800 shadow-md"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }
                  `}
                >
                  Add Product
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("manageProducts")} // New button for product management
                  className={`w-full text-left py-3 px-4 rounded-xl font-semibold transition-all duration-200 ease-in-out
                    ${
                      activeSection === "manageProducts"
                        ? "bg-amber-100 text-amber-800 shadow-md"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }
                  `}
                >
                  Manage Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveSection("addAdmin")}
                  className={`w-full text-left py-3 px-4 rounded-xl font-semibold transition-all duration-200 ease-in-out
                    ${
                      activeSection === "addAdmin"
                        ? "bg-amber-100 text-amber-800 shadow-md"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }
                  `}
                >
                  Add Admin
                </button>
              </li>
              <li className="mt-4 border-t pt-4 border-neutral-200">
                <button
                  onClick={handleLogout}
                  className="w-full bg-amber-600 text-white py-3 rounded-full font-bold text-lg hover:bg-amber-900 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-red-300 focus:ring-opacity-75"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
          {/* Right Content Display Area */}
          <div className="flex-grow">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}

export default function AdminDashboardWrapper() {
  return (
    <CartProvider>
      <AdminPage />
    </CartProvider>
  );
}
