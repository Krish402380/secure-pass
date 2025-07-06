import React from "react";

export default function LengthSlider({ length, setLength }) {
  const min = 6;
  const max = 64;

  return (
    <div className="w-full text-center space-y-2">
      <label className="block text-lg font-semibold text-gray-800 dark:text-white">
        Password Length
      </label>
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={() => setLength(Math.max(min, length - 1))}
          className="w-8 h-8 text-lg rounded-full bg-gray-600 text-white hover:bg-gray-500"
        >
          −
        </button>
        <span className="w-12 text-xl font-mono">{length}</span>
        <button
          onClick={() => setLength(Math.min(max, length + 1))}
          className="w-8 h-8 text-lg rounded-full bg-gray-600 text-white hover:bg-gray-500"
        >
          +
        </button>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={length}
        onChange={(e) => setLength(Number(e.target.value))}
        className="w-full h-2 accent-indigo-600 cursor-pointer"
      />
    </div>
  );
}
// This component provides a slider for selecting password length, with buttons to increment and decrement the value.
// It ensures the length stays within a defined range (6 to 64 characters) and updates