// frontend/src/app/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import SearchBar from "../../components/SearchBar";
import ContentBlock from "../../components/ContentBlock";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/context/CartContext"; // Import CartProvider and useCart
import CartSidebar from "@/components/CartSidebar"; 

// Define the Product type for better type safety
interface Product {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  category: string;
}

// Separate component for the Dashboard content that uses CartContext
function DashboardContent() {
  const { user, loading: userLoading, setUser } = useUser();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]); // Use Product type
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  const categories = ["all", "cakes", "cupcakes", "bread", "tarts"];

   if (user?.role === "admin") {
    router.push("/admin-dashboard");
    return null; 
  }


  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
      .then((res) => {
        if (!res.ok) {
          console.warn("Products fetch not OK, status:", res.status);
          if (res.status === 401) {
            console.log("Unauthorized to fetch products. Consider adjusting API permissions.");
          }
        }
        return res.json();
      })
      .then((data) => {
        setProducts(data);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
      });
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const filteredProducts = products.filter((product: Product) => { // Use Product type
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;

    const matchesSearch =
      product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 font-inter">
      <Header/>
      
      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />


      <main className="flex-grow p-4">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex justify-center py-6">
            <div className="flex flex-wrap justify-center gap-4 max-w-5xl w-full px-4">
              {categories.map((category) => {
                const pastelColors: { [key: string]: string } = {
                  cakes: "#D2B48C",
                  cupcakes: "#FFDAB9",
                  bread: "#FFE4E1",
                  tarts: "#C1E1C1",
                  all: "#C4B6D8",
                };

                const isSelected = selectedCategory === category;

                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    style={{
                      backgroundColor: pastelColors[category],
                      transform: isSelected ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.3s ease",
                      minWidth: "140px",
                      minHeight: "60px",
                    }}
                    className="px-8 py-5 rounded-2xl text-gray-800 text-lg font-semibold capitalize shadow-lg"
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product: Product) => ( // Use Product type
                <ContentBlock
                  key={product._id}
                  id={product._id} // Pass the product ID
                  name={product.name}
                  description={product.description}
                  imageUrl={product.imageUrl}
                  price={product.price}
                  category={product.category}
                />
              ))
            ) : (
              <div className="col-span-full text-center text-gray-600 text-lg py-10">
                No products found for this category.
              </div>
            )}
          </div>
        </div>
      </main>

      <CartSidebar /> 
    </div>
  );
}

// Wrap the DashboardContent with CartProvider
export default function DashboardPage() {
  return (
    <CartProvider>
      <DashboardContent />
    </CartProvider>
  );
}