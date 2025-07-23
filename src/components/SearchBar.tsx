// SearchBar.tsx (or SearchBar.jsx if you're still using JS but want TS type checking)
"use client";

import React, { ChangeEvent, FormEvent } from "react";

// 1. Define an interface for the component's props
interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

// 2. Use the interface to type the props
export default function SearchBar({ searchTerm, setSearchTerm }: SearchBarProps) {
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real application, you'd likely trigger a search here
    // For example, calling an API or filtering a list
    console.log("Searching for:", searchTerm);
  };

  return (
    <div className="w-full bg-neutral-50  p-3 sticky top-16 z-40 font-inter">
      <form onSubmit={handleSearchSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
        <input
          type="text"
          placeholder="Search for delicious treats..."
          value={searchTerm}
          onChange={handleSearchChange}
          required
          className="flex-grow p-2 border-2 rounded-xl bg-stone-50 border-stone-200 focus:outline-none focus:ring-3 focus:ring-amber-100 placeholder-stone-500 text-stone-800 transition-all duration-200 ease-in-out"
        />
        <button
          type="submit"
          className="bg-amber-700 text-white px-4 py-2 rounded-full font-bold text-base hover:bg-amber-800 transition-all duration-300 ease-in-out transform hover:scale-105 shadow-md focus:outline-none focus:ring-4 focus:ring-amber-400 focus:ring-opacity-75 flex-shrink-0"
        >
          <svg className="w-5 h-5 sm:ml-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 
                     16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 
                     9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 
                     4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 
                     5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 
                     11.99 14 9.5 14z"/>
          </svg>
        </button>
      </form>
    </div>
  );
}