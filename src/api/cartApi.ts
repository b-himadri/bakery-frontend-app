// frontend/src/api/cartApi.ts
interface CartItem {
  _id: string; // The item ID within the cart
  productId: {
    _id: string;
    name: string;
    imageUrl: string;
    price: number;
    // ... other product details you might populate
  };
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

const BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}/api/cart`;

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
};

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res = await fetch(BASE_URL, {
      headers: getAuthHeaders() as HeadersInit,
      cache: "no-store",
      credentials: 'include', // <-- ADDED THIS LINE
    });
    if (!res.ok) {
      throw new Error("Failed to fetch cart");
    }
    return res.json();
  },

  addToCart: async (
    productId: string,
    quantity: number
  ): Promise<Cart> => {
    const res = await fetch(`${BASE_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      } as HeadersInit,
      body: JSON.stringify({ productId, quantity }),
      credentials: 'include', // <-- ADDED THIS LINE
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to add item to cart");
    }
    return res.json();
  },

  updateCartItem: async (
    productId: string,
    quantity: number
  ): Promise<Cart> => {
    const res = await fetch(`${BASE_URL}/update`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      } as HeadersInit,
      body: JSON.stringify({ productId, quantity }),
      credentials: 'include', // <-- ADDED THIS LINE
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to update cart item");
    }
    return res.json();
  },

  removeCartItem: async (productId: string): Promise<Cart> => {
    const res = await fetch(`${BASE_URL}/remove`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      } as HeadersInit,
      body: JSON.stringify({ productId }),
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Failed to remove item from cart");
    }
    return res.json();
  },
};