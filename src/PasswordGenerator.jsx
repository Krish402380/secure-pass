import { useState, useEffect } from "react";

const CHAR_SETS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{}|;:',.<>?/~`",
  ambiguous: "Il1O0o",
};

function calculateEntropy(length, charsetSize) {
  return Math.round(length * Math.log2(charsetSize));
}

function getStrength(entropy) {
  if (entropy < 40) return { label: "Very Weak", color: "bg-red-500" };
  if (entropy < 60) return { label: "Weak", color: "bg-orange-400" };
  if (entropy < 80) return { label: "Moderate", color: "bg-yellow-400" };
  if (entropy < 100) return { label: "Strong", color: "bg-lime-500" };
  return { label: "Very Strong", color: "bg-emerald-500" };
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [entropy, setEntropy] = useState(0);

  const generatePassword = () => {
    let chars = "";
    if (useLower) chars += CHAR_SETS.lowercase;
    if (useUpper) chars += CHAR_SETS.uppercase;
    if (useNumbers) chars += CHAR_SETS.numbers;
    if (useSymbols) chars += CHAR_SETS.symbols;
    if (excludeAmbiguous) {
      chars = chars.split("").filter(c => !CHAR_SETS.ambiguous.includes(c)).join("");
    }

    if (!chars) {
      setPassword("❌ Choose at least one character set!");
      setEntropy(0);
      return;
    }

    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    const pwd = Array.from(array, x => chars[x % chars.length]).join("");
    setPassword(pwd);

    const charSetSize = new Set(chars).size;
    setEntropy(calculateEntropy(length, charSetSize));
    setCopied(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const strength = getStrength(entropy);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white dark:bg-zinc-900 rounded-xl shadow space-y-6 text-zinc-900 dark:text-zinc-100">
      <h1 className="text-3xl font-bold text-center">🔐 SecurePass Generator</h1>

      <div className="space-y-4">
        {/* Length Slider */}
        <div>
          <label className="block font-medium mb-1">Password Length: <span className="font-bold">{length}</span></label>
          <input
            type="range"
            min={6}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Character Options */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <label className="flex gap-2 items-center"><input type="checkbox" checked={useUpper} onChange={() => setUseUpper(!useUpper)} /> Uppercase</label>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={useLower} onChange={() => setUseLower(!useLower)} /> Lowercase</label>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={useNumbers} onChange={() => setUseNumbers(!useNumbers)} /> Numbers</label>
          <label className="flex gap-2 items-center"><input type="checkbox" checked={useSymbols} onChange={() => setUseSymbols(!useSymbols)} /> Symbols</label>
          <label className="flex gap-2 items-center col-span-2"><input type="checkbox" checked={excludeAmbiguous} onChange={() => setExcludeAmbiguous(!excludeAmbiguous)} /> Exclude Ambiguous Characters</label>
        </div>

        {/* Generate Button */}
        <button
          onClick={generatePassword}
          className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white font-semibold py-2 rounded shadow"
        >
          🔁 Generate Password
        </button>

        {/* Password Output */}
        {password && (
          <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded flex justify-between items-center font-mono text-sm sm:text-base break-all">
            <span>{password}</span>
            <button
              onClick={copyToClipboard}
              className="ml-4 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm"
            >
              {copied ? "✅ Copied" : "📋 Copy"}
            </button>
          </div>
        )}

        {/* Entropy Meter */}
        {entropy > 0 && (
          <div className="space-y-1">
            <div className="text-sm">
              Entropy: <span className="font-semibold">{entropy} bits</span> ({strength.label})
            </div>
            <div className="w-full h-3 bg-zinc-300 dark:bg-zinc-700 rounded">
              <div className={`h-3 rounded ${strength.color}`} style={{ width: `${Math.min(entropy, 128)}%` }}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// This code defines a PasswordGenerator component that allows users to generate secure passwords with customizable options.
// It includes features like character set selection, password length adjustment, entropy calculation, and a copy-to-clipboard function.
// The component uses React hooks for state management and effects, and it provides visual feedback on password strength and entropy.
// The UI is styled with Tailwind CSS for a modern and responsive design.       