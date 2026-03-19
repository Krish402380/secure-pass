// src/App.jsx
import React, { useMemo, useState } from "react";
import "./App.css";

const STRENGTH_STATES = [
  { min: 80, label: "Rock solid", gradient: "linear-gradient(90deg, #34d399, #22d3ee, #8b5cf6)", hint: "Ready for your most important accounts" },
  { min: 55, label: "Strong", gradient: "linear-gradient(90deg, #38bdf8, #4f46e5)", hint: "Great mix of length and variety" },
  { min: 35, label: "Okay", gradient: "linear-gradient(90deg, #f59e0b, #f97316, #fb7185)", hint: "Add symbols or length for extra safety" },
  { min: 1, label: "Weak", gradient: "linear-gradient(90deg, #fb7185, #f97316)", hint: "Increase the length and enable more sets" },
  { min: 0, label: "Awaiting options", gradient: "linear-gradient(90deg, #475569, #334155)", hint: "Pick at least one character set to start" },
];

const characterSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()_+-=[]{}|;:',.<>/?",
};

function PasswordStrengthBar({ score }) {
  const width = `${Math.max(Math.min(score, 100), 0)}%`;
  const tone = STRENGTH_STATES.find((tier) => score >= tier.min) ?? STRENGTH_STATES.at(-1);
  const gradient = tone?.gradient ?? "linear-gradient(90deg, #22d3ee, #a855f7)";

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/10">
      <div className="h-full transition-all duration-300 ease-out" style={{ width, backgroundImage: gradient }} />
    </div>
  );
}

function ToggleRow({ title, helper, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3 transition hover:border-white/20">
      <div className="space-y-0.5">
        <p className="font-semibold text-slate-100">{title}</p>
        <p className="text-xs text-slate-400">{helper}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange((prev) => !prev)}
        className={`switch ${checked ? "switch--on" : ""}`}
      >
        <span className="switch__thumb" />
      </button>
    </div>
  );
}

function buildCharset(options) {
  let pool = "";
  Object.entries(options).forEach(([key, enabled]) => {
    if (enabled) pool += characterSets[key];
  });
  return pool;
}

function generateRandomPassword(pool, length) {
  if (!pool) return "";
  const array = new Uint32Array(length);

  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < length; i += 1) {
      array[i] = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
    }
  }

  const chars = pool.split("");
  return Array.from(array, (value) => chars[value % chars.length]).join("");
}

function App() {
  const [length, setLength] = useState(18);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [password, setPassword] = useState("");
  const [entropy, setEntropy] = useState(0);
  const [copied, setCopied] = useState(false);

  const options = useMemo(
    () => ({
      uppercase: includeUppercase,
      lowercase: includeLowercase,
      numbers: includeNumbers,
      symbols: includeSymbols,
    }),
    [includeNumbers, includeSymbols, includeLowercase, includeUppercase],
  );

  const pool = useMemo(() => buildCharset(options), [options]);
  const strengthScore = pool ? Math.min(100, Math.round((entropy / 128) * 100)) : 0;
  const tier = STRENGTH_STATES.find((state) => strengthScore >= state.min) ?? STRENGTH_STATES.at(-1);

  const handleGenerate = () => {
    const next = generateRandomPassword(pool, length);
    setPassword(next);

    const uniqueSetSize = new Set(pool).size || 1;
    const bits = Math.round(length * Math.log2(uniqueSetSize));
    setEntropy(bits);
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Unable to copy", err);
    }
  };

  return (
    <div className="app-shell">
      <div className="glow glow--one" />
      <div className="glow glow--two" />
      <div className="glow glow--three" />

      <div className="w-full max-w-5xl mx-auto space-y-8 relative">
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live entropy tuning
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-slate-50 sm:text-5xl">PassForge</h1>
            <p className="text-slate-300 text-base sm:text-lg">Craft resilient passwords with a brighter, modern workspace.</p>
          </div>
        </header>

        <div className="glass-card p-6 sm:p-8 space-y-8">
          <div className="grid gap-8 md:grid-cols-5 items-start">
            <div className="md:col-span-3 space-y-6">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-4 sm:p-5 shadow-inner">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/40 to-violet-500/40 text-cyan-100">
                      🔒
                    </span>
                    <div>
                      <p className="font-semibold text-slate-100">Generated password</p>
                      <p className="text-xs text-slate-400">Copy or regenerate any time</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:border-cyan-400/50 hover:bg-cyan-400/10"
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>

                <div className="password-panel">
                  <p className="password-text">{password || "Select your mix and generate something unbreakable."}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                    Entropy: <span className="font-semibold text-slate-50">{entropy} bits</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-lg">⚡</span>
                    <span className="font-semibold text-slate-50">{tier.label}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <PasswordStrengthBar score={strengthScore} />
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
                  <p className="flex items-center gap-2">
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                    {tier.hint}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex h-2 w-2 rounded-full bg-white/30" />
                    Each bar reacts instantly to your choices
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex w-full flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110"
                >
                  Generate a fresh password
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-base font-semibold text-slate-100 transition hover:border-cyan-300/60 hover:bg-cyan-400/10"
                >
                  Copy to clipboard
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Length</p>
                    <h2 className="text-2xl font-semibold text-slate-50">{length} characters</h2>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">Range 4 - 64</span>
                </div>

                <div className="mt-4 space-y-2">
                  <input
                    type="range"
                    min={4}
                    max={64}
                    value={length}
                    onChange={(e) => setLength(Number(e.target.value))}
                    className="range-slider"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Short & quick</span>
                    <span>Ultra strong</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <ToggleRow
                  title="Uppercase (A–Z)"
                  helper="Adds emphasis and complexity"
                  checked={includeUppercase}
                  onChange={setIncludeUppercase}
                />
                <ToggleRow
                  title="Lowercase (a–z)"
                  helper="Keeps things readable"
                  checked={includeLowercase}
                  onChange={setIncludeLowercase}
                />
                <ToggleRow
                  title="Numbers (0–9)"
                  helper="Great for entropy gains"
                  checked={includeNumbers}
                  onChange={setIncludeNumbers}
                />
                <ToggleRow
                  title="Symbols (!@#...)"
                  helper="Sprinkle in special characters"
                  checked={includeSymbols}
                  onChange={setIncludeSymbols}
                />
              </div>

              <div className="rounded-xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300 shadow-inner">
                <p className="font-semibold text-slate-100 mb-1">Quick tip</p>
                <p className="leading-relaxed">
                  Aim for at least <span className="text-cyan-200 font-semibold">16 characters</span> with three different sets enabled. Mixing
                  everything with a longer length pushes the entropy meter to green.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
