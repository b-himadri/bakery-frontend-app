// frontend/src/context/CartContext.tsx
"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { cartApi } from "../api/cartApi";
import { useUser } from "./UserContext"; // Import useUser

interface ProductInCart {
  _id: string; // Product ID
  name: string;
  imageUrl: string;
  price: number;
}

interface CartItem {
  _id: string; // The cart item's unique ID
  productId: ProductInCart; // Populated product details
  quantity: number;
}

interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

type CartContextType = {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity: number) => Promise<void>;
  updateItemQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser(); // Get user and userLoading
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const fetchCart = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedCart = await cartApi.getCart();
      setCart(fetchedCart);
    } catch (err: any) {
      console.error("Error fetching cart:", err);
      setError(err.message || "Failed to load cart.");
      // FIX: Provide placeholder values for all required properties
      setCart({
        _id: "client-side-empty-cart", // A unique but temporary ID for client-side empty cart
        items: [],
        createdAt: new Date().toISOString(), // Current date/time
        updatedAt: new Date().toISOString(), // Current date/time
        // userId and sessionId are optional, so no need to provide them
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch cart initially and whenever user logs in/out
    if (!userLoading) {
      fetchCart();
    }
  }, [user, userLoading]); // Re-fetch when user or userLoading changes

  const addToCart = async (productId: string, quantity: number) => {
    setError(null);
    try {
      const updatedCart = await cartApi.addToCart(productId, quantity);
      setCart(updatedCart);
      // Optional: show a success message
    } catch (err: any) {
      console.error("Error adding to cart:", err);
      setError(err.message || "Failed to add item to cart.");
    }
  };

  const updateItemQuantity = async (productId: string, quantity: number) => {
    setError(null);
    if (quantity < 1) {
      // If quantity drops to 0 or less, remove the item
      await removeItem(productId);
      return;
    }
    try {
      const updatedCart = await cartApi.updateCartItem(productId, quantity);
      setCart(updatedCart);
      // Optional: show a success message
    } catch (err: any) {
      console.error("Error updating cart item:", err);
      setError(err.message || "Failed to update cart item.");
    }
  };

  const removeItem = async (productId: string) => {
    setError(null);
    try {
      const updatedCart = await cartApi.removeCartItem(productId);
      setCart(updatedCart);
      // Optional: show a success message
    } catch (err: any) {
      console.error("Error removing item from cart:", err);
      setError(err.message || "Failed to remove item from cart.");
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        addToCart,
        updateItemQuantity,
        removeItem,
        isCartOpen,
        setIsCartOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}