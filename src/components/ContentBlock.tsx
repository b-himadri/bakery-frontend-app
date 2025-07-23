// frontend/src/components/ContentBlock.tsx
'use client'

import { useCart } from '@/context/CartContext' // Import useCart
import { toast } from 'react-hot-toast' // ✅ Import toast


type ContentBlockProps = {
  id: string; // Add product ID here
  name: string
  description: string
  imageUrl: string
  price: number,
  category: string
}

export default function ContentBlock({ id, name, description, imageUrl , price , category}: ContentBlockProps) {
  const { addToCart } = useCart(); // Get addToCart function

  // Function to handle adding a single item to cart
  const handleAddToCart = async () => {
    const quantityToAdd = 1; // Always add 1 item
    await addToCart(id, quantityToAdd); // Use the passed product ID
    toast.success(`${quantityToAdd} x ${name} added to cart! ✅`) // ✅ Toast feedback
  }

  return (
    <div
      className="bg-white rounded-3xl shadow-xl p-6 w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center text-center transform transition-all duration-300 hover:scale-[1.02] border border-neutral-200"
      style={{
        boxShadow: "0 15px 30px rgba(101, 67, 33, 0.15)", // Softer chocolaty shadow
      }}
    >
      <img
        src={imageUrl}
        alt={name}
        className="w-full h-48 object-cover rounded-2xl mb-4 shadow-sm" // Changed to object-cover for better fill, added shadow
        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x200/F0E68C/654321?text=Image+Not+Found'; }} // Placeholder fallback
      />
      <h2 className="text-xl font-extrabold text-amber-800 mb-2">{name}</h2> {/* Rich brown for title */}
      <p className="text-sm text-neutral-700 mb-4 px-2">{description}</p> {/* Neutral brown for description */}
    <p className="text-md font-semibold text-amber-900 mb-2 px-2">
  Price: <span className="text-lg text-amber-600">Rs. {price}</span>
</p>

      {/* Removed the quantity increment/decrement buttons and quantityToAdd state */}
      <button
        onClick={handleAddToCart}
        className="w-full bg-amber-700 text-white py-2 rounded-full font-bold text-md hover:bg-amber-800 transform hover:scale-105 transition-transform duration-300 shadow-lg mt-4" // Added mt-4 for spacing
      >
        Add to Cart
      </button>
    </div>
  )
}