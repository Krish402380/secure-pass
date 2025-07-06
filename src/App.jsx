import React, { useState } from "react";

// Character pools
const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()_+[]{}|;:,.<>?";

export default function App() {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState("");

  function generatePassword() {
    let charset = "";
    if (includeUppercase) charset += UPPERCASE;
    if (includeLowercase) charset += LOWERCASE;
    if (includeNumbers) charset += NUMBERS;
    if (includeSymbols) charset += SYMBOLS;

    if (!charset) return setPassword("❌ No charset selected");

    let pass = "";
    for (let i = 0; i < length; i++) {
      const index = Math.floor(Math.random() * charset.length);
      pass += charset[index];
    }
    setPassword(pass);
  }

  function calculateEntropy() {
    let poolSize = 0;
    if (includeUppercase) poolSize += UPPERCASE.length;
    if (includeLowercase) poolSize += LOWERCASE.length;
    if (includeNumbers) poolSize += NUMBERS.length;
    if (includeSymbols) poolSize += SYMBOLS.length;

    return Math.round(length * Math.log2(poolSize));
  }

  function entropyStrength() {
    const entropy = calculateEntropy();
    if (entropy >= 128) return { label: "Very Strong", color: "bg-green-600" };
    if (entropy >= 100) return { label: "Strong", color: "bg-green-500" };
    if (entropy >= 60) return { label: "Moderate", color: "bg-yellow-500" };
    if (entropy >= 40) return { label: "Weak", color: "bg-orange-500" };
    return { label: "Very Weak", color: "bg-red-500" };
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-xl bg-white p-6 sm:p-10 rounded-xl shadow-lg space-y-6 text-center">
        <h1 className="text-3xl font-bold text-indigo-600">
          🔐 SecurePass Generator
        </h1>

        {/* Length Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLength(Math.max(length - 1, 4))}
              className="w-8 h-8 bg-gray-300 rounded-full font-bold text-black"
            >
              –
            </button>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-64 accent-indigo-500"
            />
            <button
              onClick={() => setLength(Math.min(length + 1, 64))}
              className="w-8 h-8 bg-gray-300 rounded-full font-bold text-black"
            >
              +
            </button>
          </div>
          <span className="text-sm">
            Password Length: <strong>{length}</strong>
          </span>
        </div>

        {/* Character Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-left">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeUppercase}
              onChange={() => setIncludeUppercase(!includeUppercase)}
            />
            Include Uppercase (A–Z)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeLowercase}
              onChange={() => setIncludeLowercase(!includeLowercase)}
            />
            Include Lowercase (a–z)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeNumbers}
              onChange={() => setIncludeNumbers(!includeNumbers)}
            />
            Include Numbers (0–9)
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeSymbols}
              onChange={() => setIncludeSymbols(!includeSymbols)}
            />
            Include Symbols (!@#$)
          </label>
        </div>

        {/* Entropy */}
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            Entropy: {calculateEntropy()} bits –{" "}
            <strong>{entropyStrength().label}</strong>
          </p>
          <div className="w-full bg-gray-300 h-2 rounded">
            <div
              className={`${entropyStrength().color} h-2 rounded`}
              style={{ width: `${Math.min(calculateEntropy() / 1.3, 100)}%` }}
            />
          </div>
        </div>

        {/* Password Output */}
        <div
          onClick={(e) => {
            const range = document.createRange();
            range.selectNode(e.target);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
          }}
          className="w-full bg-zinc-100 text-black text-center font-mono text-2xl py-4 px-6 rounded shadow-inner cursor-pointer select-text"
        >
          {password || "🔐 Password will appear here"}
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={generatePassword}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-semibold shadow"
          >
            🔁 Generate
          </button>
          {password && (
            <button
              onClick={() => navigator.clipboard.writeText(password)}
              className="text-indigo-600 hover:underline text-sm"
            >
              📋 Copy to clipboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
