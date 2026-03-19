// src/App.jsx
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// ─── Constants ───────────────────────────────────────────────────────────────

const ENTROPY_TIERS = [
  { min: 80, label: "Unbreakable", color: "#10b981", hint: "Ready for your most critical accounts" },
  { min: 60, label: "Strong",      color: "#22d3ee", hint: "Great mix of length and variety" },
  { min: 40, label: "Fair",        color: "#f59e0b", hint: "Add more length or character sets for safety" },
  { min: 1,  label: "Weak",        color: "#ef4444", hint: "Increase length and enable more sets" },
  { min: 0,  label: "—",           color: "#475569", hint: "Pick at least one character set to start" },
];

const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers:   "0123456789",
  symbols:   "!@#$%^&*()_+-=[]{}|;:',.<>/?",
};

const TOGGLE_META = [
  {
    key:       "uppercase",
    title:     "Uppercase (A–Z)",
    onHelper:  "Adds emphasis and complexity",
    offHelper: "Off — missing 26 possible characters per position",
    entropy:   "+~4.7 bits",
    setter:    "setIncludeUppercase",
  },
  {
    key:       "lowercase",
    title:     "Lowercase (a–z)",
    onHelper:  "Keeps things readable",
    offHelper: "Off — missing 26 possible characters per position",
    entropy:   "+~4.7 bits",
    setter:    "setIncludeLowercase",
  },
  {
    key:       "numbers",
    title:     "Numbers (0–9)",
    onHelper:  "Great for entropy gains",
    offHelper: "Off — missing 10 possible characters per position",
    entropy:   "+~3.3 bits",
    setter:    "setIncludeNumbers",
  },
  {
    key:       "symbols",
    title:     "Symbols (!@#…)",
    onHelper:  "Sprinkle in special characters",
    offHelper: "Off — missing 32 possible characters per position",
    entropy:   "+~5.0 bits",
    setter:    "setIncludeSymbols",
  },
];

const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

// Max entropy value used to scale the meter bar (128 bits)
const ENTROPY_MAX_SCALE = 128;

// ─── Utility helpers ──────────────────────────────────────────────────────────

function buildCharset(options) {
  return Object.entries(options)
    .filter(([, enabled]) => enabled)
    .map(([key]) => CHARACTER_SETS[key])
    .join("");
}

function generateRandomPassword(pool, length) {
  if (!pool) return "";
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Secure random number generation is not available in this browser.");
  }
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  const chars = pool.split("");
  return Array.from(array, (v) => chars[v % chars.length]).join("");
}

function calcEntropy(pool, length) {
  const uniqueSize = new Set(pool).size || 1;
  return pool ? Math.round(length * Math.log2(uniqueSize)) : 0;
}

function getEntropyTier(entropy) {
  return ENTROPY_TIERS.find((t) => entropy >= t.min) ?? ENTROPY_TIERS.at(-1);
}

function estimateCrackTime(entropy) {
  if (entropy <= 0) return "";
  const guessesPerSec = 1e10; // 10 billion/sec
  const seconds = Math.pow(2, entropy) / (2 * guessesPerSec);
  if (seconds < 1)      return "< 1 second";
  if (seconds < 60)     return `~${Math.round(seconds)} seconds`;
  if (seconds < 3600)   return `~${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400)  return `~${Math.round(seconds / 3600)} hours`;
  if (seconds < 3.156e7) return `~${Math.round(seconds / 86400)} days`;
  if (seconds < 3.156e9) return `~${Math.round(seconds / 3.156e7)} years`;
  if (seconds < 3.156e12) return `~${(seconds / 3.156e9).toFixed(1)} thousand years`;
  if (seconds < 3.156e15) return `~${(seconds / 3.156e12).toFixed(1)} million years`;
  if (seconds < 3.156e18) return `~${(seconds / 3.156e15).toFixed(1)} billion years`;
  return `~${(seconds / 3.156e18).toFixed(1)} trillion years`;
}

function getContextTip(entropy, length, activeCount, allOn) {
  if (activeCount === 0)
    return { icon: "💡", text: "Pick at least one character set to start generating passwords." };
  if (length < 12)
    return { icon: "⚠️", text: "Short passwords are cracked in seconds — push to 16+ for real security." };
  if (activeCount === 1)
    return { icon: "⚠️", text: "Single charset drops entropy significantly — enable at least one more type." };
  if (allOn && length > 20)
    return { icon: "✅", text: "You're in excellent shape — this password is practically uncrackable." };
  if (entropy < 60)
    return { icon: "💡", text: "Enable more character sets or increase length to push into strong territory." };
  return { icon: "✅", text: `${length} characters with ${activeCount} sets active — solid choice.` };
}

// ─── Scramble animation hook ──────────────────────────────────────────────────

function useScramble(target, duration = 380) {
  const [display, setDisplay] = useState(target);
  const rafRef  = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (!target) { setDisplay(""); return; }

    startRef.current = null;

    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed  = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const reveal   = Math.floor(progress * target.length);

      const scrambled = target
        .split("")
        .map((ch, i) =>
          i < reveal
            ? ch
            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
        )
        .join("");

      setDisplay(scrambled);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// ─── EntropyMeter component ───────────────────────────────────────────────────

function EntropyMeter({ entropy }) {
  const tier = getEntropyTier(entropy);
  const pct  = Math.min(Math.max((entropy / ENTROPY_MAX_SCALE) * 100, 0), 100);

  let fillGradient;
  if (entropy <= 0)      fillGradient = "linear-gradient(90deg, #475569, #334155)";
  else if (entropy < 40) fillGradient = "linear-gradient(90deg, #ef4444, #f97316)";
  else if (entropy < 60) fillGradient = "linear-gradient(90deg, #f97316, #f59e0b)";
  else if (entropy < 80) fillGradient = "linear-gradient(90deg, #f59e0b, #22d3ee)";
  else                   fillGradient = "linear-gradient(90deg, #22d3ee, #10b981)";

  return (
    <div className="entropy-meter">
      <div className="entropy-meter__header">
        <span className="entropy-meter__label-left">
          {/* Shield icon conveys strength even without color */}
          {entropy <= 0 ? "🛡" : entropy < 40 ? "🛡" : entropy < 60 ? "🛡🛡" : entropy < 80 ? "🛡🛡🛡" : "🛡🛡🛡🛡"}
          &nbsp;Entropy
        </span>
        <span className="entropy-meter__label-right" style={{ color: tier.color }}>
          {entropy > 0 ? `${entropy} bits` : "—"}&nbsp;·&nbsp;
          <strong>{tier.label}</strong>
        </span>
      </div>

      <div className="entropy-meter__track" role="progressbar" aria-valuenow={entropy} aria-valuemin={0} aria-valuemax={128} aria-label={`Entropy: ${entropy} bits, ${tier.label}`}>
        {/* Segmented zone backgrounds */}
        <div className="entropy-meter__segments" aria-hidden="true">
          <div className="em-seg em-seg--weak"        title="Weak (<40 bits)" />
          <div className="em-seg em-seg--fair"        title="Fair (40–60 bits)" />
          <div className="em-seg em-seg--strong"      title="Strong (60–80 bits)" />
          <div className="em-seg em-seg--unbreakable" title="Unbreakable (80+ bits)" />
        </div>
        {/* Animated fill */}
        <div
          className="entropy-meter__fill"
          style={{ width: `${pct}%`, backgroundImage: fillGradient }}
        />
      </div>

      <div className="entropy-meter__zones" aria-hidden="true">
        <span>Weak</span>
        <span>Fair</span>
        <span>Strong</span>
        <span>Unbreakable</span>
      </div>
    </div>
  );
}

// ─── ToggleRow component ──────────────────────────────────────────────────────

function ToggleRow({ id, title, onHelper, offHelper, entropyDelta, checked, onChange }) {
  const [flash, setFlash] = useState(false);

  const handleChange = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 400);
    onChange((prev) => !prev);
  }, [onChange]);

  return (
    <div className={`toggle-row${flash ? " toggle-row--flash" : ""}${!checked ? " toggle-row--off" : ""}`}>
      <div className="toggle-row__body">
        <p className="toggle-row__title">{title}</p>
        <p className="toggle-row__helper">{checked ? onHelper : offHelper}</p>
      </div>
      <div className="toggle-row__controls">
        <span className={`entropy-delta${checked ? " entropy-delta--on" : " entropy-delta--off"}`} aria-hidden="true">
          {entropyDelta}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={title}
          id={id}
          onClick={handleChange}
          className={`switch${checked ? " switch--on" : ""}`}
        >
          <span className="switch__thumb" aria-hidden="true" />
          <span className="switch__label">{checked ? "ON" : "OFF"}</span>
        </button>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [length,           setLength]           = useState(18);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers,   setIncludeNumbers]   = useState(true);
  const [includeSymbols,   setIncludeSymbols]   = useState(true);
  const [password,         setPassword]         = useState("");
  const [copied,           setCopied]           = useState(false);
  const [showPassword,     setShowPassword]     = useState(true);
  const [locked,           setLocked]           = useState(false);

  const setterMap = {
    setIncludeUppercase,
    setIncludeLowercase,
    setIncludeNumbers,
    setIncludeSymbols,
  };

  const options = useMemo(
    () => ({
      uppercase: includeUppercase,
      lowercase: includeLowercase,
      numbers:   includeNumbers,
      symbols:   includeSymbols,
    }),
    [includeUppercase, includeLowercase, includeNumbers, includeSymbols],
  );

  const pool    = useMemo(() => buildCharset(options), [options]);
  const entropy = useMemo(() => calcEntropy(pool, length), [pool, length]);
  const crackTime  = useMemo(() => estimateCrackTime(entropy), [entropy]);
  const activeCount = Object.values(options).filter(Boolean).length;
  const allOn       = activeCount === 4;

  const doGenerate = useCallback(() => {
    if (!pool) { setPassword(""); return; }
    setPassword(generateRandomPassword(pool, length));
    setCopied(false);
  }, [pool, length]);

  // Auto-generate on first load
  useEffect(() => { doGenerate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-regenerate when options or length change (unless locked).
  // doGenerate is a useCallback tied to [pool, length], so this fires on those changes.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (!locked) doGenerate();
  }, [doGenerate, locked]);

  const displayPassword = useScramble(password);

  const handleCopy = useCallback(async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      console.error("Unable to copy", err);
    }
  }, [password]);

  const tip = getContextTip(entropy, length, activeCount, allOn);

  // Slider background: red (short) → yellow (mid) → green (long)
  const sliderBg = `linear-gradient(90deg, hsl(0,80%,55%) 0%, hsl(45,95%,55%) 40%, hsl(150,75%,45%) 80%, hsl(155,80%,42%) 100%)`;

  return (
    <div className="app-shell">
      <div className="glow glow--one" />
      <div className="glow glow--two" />
      <div className="glow glow--three" />

      <div className="w-full max-w-5xl mx-auto space-y-8 relative">

        {/* ── Header ── */}
        <header className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1 text-sm text-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live entropy tuning
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-slate-50 sm:text-5xl">PassForge</h1>
            <p className="text-slate-300 text-base sm:text-lg">
              Craft resilient passwords with a brighter, modern workspace.
            </p>
          </div>
        </header>

        <div className="glass-card p-6 sm:p-8 space-y-8">
          <div className="grid gap-8 md:grid-cols-5 items-start">

            {/* ════════════ OUTPUT ZONE ════════════ */}
            <div className="md:col-span-3 space-y-5">

              {/* Password display box */}
              <div className="pw-box">
                {/* Header row */}
                <div className="pw-box__header">
                  <div className="pw-box__title-group">
                    {/* Lock / pin toggle */}
                    <button
                      type="button"
                      aria-label={locked ? "Unpin password — allow auto-regeneration" : "Pin password — freeze from auto-regeneration"}
                      title={locked ? "Pinned. Click to allow auto-regeneration." : "Click to pin this password."}
                      onClick={() => setLocked((v) => !v)}
                      className={`lock-btn${locked ? " lock-btn--locked" : ""}`}
                    >
                      {locked ? "🔒" : "🔓"}
                    </button>
                    <div>
                      <p className="pw-box__title">Generated password</p>
                      <p className="pw-box__subtitle">
                        {locked ? "Pinned — won't change when you adjust settings" : "Auto-regenerates as you adjust settings"}
                      </p>
                    </div>
                  </div>
                  {/* Reveal / hide */}
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Reveal password"}
                    title={showPassword ? "Hide password" : "Reveal password"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="reveal-btn"
                  >
                    {showPassword ? "👁 Hide" : "👁 Show"}
                  </button>
                </div>

                {/* Password text */}
                <div className="password-panel" aria-live="polite" aria-label="Generated password">
                  <p className="password-text">
                    {(() => {
                      if (!showPassword) return password ? "•".repeat(password.length) : "\u00A0";
                      return displayPassword || "\u00A0";
                    })()}
                  </p>
                  {password && (
                    <span className="pw-char-count" aria-hidden="true">{password.length}</span>
                  )}
                </div>

                {/* Crack-time line */}
                {entropy > 0 && (
                  <p className="crack-time-hint">
                    ⏱ Crack time at 10B guesses/sec:&nbsp;
                    <span className="crack-time-value">{crackTime}</span>
                  </p>
                )}
              </div>

              {/* ── ENTROPY METER (headline feature) ── */}
              <EntropyMeter entropy={entropy} />

              {/* ── ACTION ZONE ── */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={doGenerate}
                  disabled={!pool}
                  className="generate-btn"
                  aria-label="Generate a fresh password"
                >
                  <span aria-hidden="true" className="generate-btn__icon">🎲</span>
                  Generate a fresh password
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  disabled={!password}
                  className="copy-btn"
                  aria-label="Copy password to clipboard"
                >
                  {copied ? "✅ Copied!" : "📋 Copy to clipboard"}
                </button>
              </div>
            </div>

            {/* ════════════ CONTROLS ZONE ════════════ */}
            <div className="md:col-span-2 space-y-4">

              {/* Length slider */}
              <div className="slider-card">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Length</p>
                  <h2 className="text-2xl font-semibold text-slate-50">{length} characters</h2>
                  {crackTime && (
                    <p className="text-xs text-slate-500 mt-0.5">{crackTime} to crack</p>
                  )}
                </div>

                <div className="mt-4 space-y-1">
                  <div className="slider-wrap">
                    <input
                      type="range"
                      min={4}
                      max={64}
                      value={length}
                      onChange={(e) => setLength(Number(e.target.value))}
                      className="range-slider"
                      style={{ "--slider-bg": sliderBg }}
                      aria-label={`Password length: ${length} characters`}
                      aria-valuemin={4}
                      aria-valuemax={64}
                      aria-valuenow={length}
                    />
                    {/* Tick marks */}
                    <div className="slider-ticks" aria-hidden="true">
                      {[4, 8, 16, 32, 64].map((v) => (
                        <span
                          key={v}
                          className="tick"
                          style={{ left: `${((v - 4) / 60) * 100}%` }}
                        >
                          <span className="tick__bar" />
                          <span className="tick__label">{v}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500 pt-6 px-0.5">
                    <span>4</span>
                    <span>64</span>
                  </div>
                </div>
              </div>

              {/* Character-set toggles */}
              <div className="space-y-3">
                {TOGGLE_META.map((meta) => (
                  <ToggleRow
                    key={meta.key}
                    id={`toggle-${meta.key}`}
                    title={meta.title}
                    onHelper={meta.onHelper}
                    offHelper={meta.offHelper}
                    entropyDelta={meta.entropy}
                    checked={options[meta.key]}
                    onChange={setterMap[meta.setter]}
                  />
                ))}

                {/* Maximum mix indicator */}
                {allOn && (
                  <div className="max-mix-badge" role="status" aria-live="polite">
                    <span aria-hidden="true">✨</span> Maximum mix — all character sets active
                  </div>
                )}

                {/* Symbols-off contextual note */}
                {!includeSymbols && (
                  <div className="symbols-tip" role="note">
                    💡 Some sites block special characters — symbols are off, which works great for those.
                  </div>
                )}
              </div>

              {/* Context-aware quick tip */}
              <div className="tip-card">
                <p className="tip-card__heading">{tip.icon} Quick tip</p>
                <p className="tip-card__body">{tip.text}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
