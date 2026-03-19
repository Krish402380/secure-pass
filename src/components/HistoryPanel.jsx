import React, { useState, useCallback, useEffect, useRef } from "react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(isoStr) {
  const diff = Date.now() - new Date(isoStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60)  return "just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr ago`;
}

function maskPassword(pwd) {
  if (!pwd || pwd.length <= 8) return "•".repeat(pwd.length || 0);
  return pwd.slice(0, 4) + "···" + pwd.slice(-4);
}

// ─── Charset Badges ───────────────────────────────────────────────────────────

function CharsetBadges({ charsets }) {
  const badges = [
    { key: "uppercase", label: "U" },
    { key: "lowercase", label: "L" },
    { key: "numbers",   label: "N" },
    { key: "symbols",   label: "S" },
  ];
  return (
    <div className="hist-badges" aria-hidden="true">
      {badges.map(({ key, label }) => (
        <span
          key={key}
          className={`hist-badge${charsets[key] ? " hist-badge--on" : ""}`}
          title={`${key}: ${charsets[key] ? "on" : "off"}`}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Single History Entry ─────────────────────────────────────────────────────

function HistoryEntry({ entry, leavingId, onCopy, onDelete, onRestore }) {
  const [hovered, setHovered] = useState(false);
  const isLeaving = leavingId === entry.id;

  return (
    <div
      className={`hist-entry${isLeaving ? " hist-entry--leaving" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Copied left-border highlight */}
      {entry.copiedAt && <span className="hist-entry__copied-bar" aria-hidden="true" />}

      <div className="hist-entry__main">
        {/* Password (masked → revealed on hover) */}
        <div className="hist-entry__pw-row">
          <span className="hist-entry__pw-text" title={hovered ? undefined : "Hover to reveal"}>
            {hovered ? entry.password : maskPassword(entry.password)}
          </span>
          {entry.copiedAt && (
            <span className="hist-entry__copied-dot" aria-label="Most recently copied" />
          )}
        </div>

        {/* Meta row */}
        <div className="hist-entry__meta">
          <CharsetBadges charsets={entry.charsets} />
          <span className="hist-entry__entropy">
            {entry.entropy}b&nbsp;·&nbsp;{entry.strengthLabel}
          </span>
          {/* tick is just passed down to force re-render for timestamp updates */}
          <span className="hist-entry__time" aria-live="off">{relativeTime(entry.generatedAt)}</span>
        </div>
      </div>

      {/* Action buttons — hidden by default on desktop, always visible on mobile */}
      <div className={`hist-entry__actions${hovered ? " hist-entry__actions--visible" : ""}`}>
        <button
          type="button"
          className="hist-action-btn"
          onClick={() => onCopy(entry)}
          title="Copy password"
          aria-label="Copy this password"
        >
          📋
        </button>
        <button
          type="button"
          className="hist-action-btn"
          onClick={() => onRestore(entry)}
          title="Restore password to main display"
          aria-label="Restore this password"
        >
          ↩
        </button>
        <button
          type="button"
          className="hist-action-btn hist-action-btn--danger"
          onClick={() => onDelete(entry.id)}
          title="Delete entry"
          aria-label="Delete this history entry"
        >
          🗑
        </button>
      </div>
    </div>
  );
}

// ─── History Panel ────────────────────────────────────────────────────────────

export default function HistoryPanel({
  history,
  collapsed,
  leavingId,
  onToggleCollapse,
  onCopy,
  onDelete,
  onRestore,
  onClearAll,
}) {
  // "idle" | "confirm" | "cleared"
  const [clearState, setClearState] = useState("idle");
  const clearTimerRef = useRef(null);

  // Tick every 30 s to refresh relative timestamps
  const [_tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  // Clean up timer on unmount
  useEffect(() => () => { if (clearTimerRef.current) clearTimeout(clearTimerRef.current); }, []);

  // If history drops to 0 after clearing, reset confirm state
  useEffect(() => {
    if (history.length === 0 && clearState === "confirm") setClearState("idle");
  }, [history.length, clearState]);

  const handleClearClick = useCallback(() => setClearState("confirm"), []);

  const handleClearConfirm = useCallback(() => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    onClearAll();
    setClearState("cleared");
    clearTimerRef.current = setTimeout(() => setClearState("idle"), 2000);
  }, [onClearAll]);

  const handleClearCancel = useCallback(() => setClearState("idle"), []);

  const count = history.length;

  return (
    <div className="history-panel">
      {/* ── Header ── */}
      <div
        className="history-panel__header"
        onClick={onToggleCollapse}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand session history" : "Collapse session history"}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggleCollapse(); } }}
      >
        <div className="history-panel__header-left">
          {clearState === "cleared" ? (
            <span className="history-panel__cleared-msg">✅ History cleared</span>
          ) : (
            <>
              <span className="history-panel__title">Session History</span>
              <span className="history-panel__count">({count}/10)</span>
            </>
          )}
        </div>

        {/* Right-side controls — stop propagation so clicks don't toggle collapse */}
        <div
          className="history-panel__header-right"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {clearState === "idle" && count >= 2 && (
            <button
              type="button"
              className="history-clear-btn"
              onClick={handleClearClick}
              aria-label={`Clear all ${count} history entries`}
            >
              Clear all
            </button>
          )}
          {clearState === "confirm" && (
            <span className="history-clear-confirm">
              Clear {count} password{count !== 1 ? "s" : ""}?&nbsp;
              <button type="button" className="history-confirm-btn" onClick={handleClearConfirm}>
                Confirm
              </button>
              &nbsp;/&nbsp;
              <button type="button" className="history-cancel-btn" onClick={handleClearCancel}>
                Cancel
              </button>
            </span>
          )}
        </div>

        {/* Chevron */}
        <span
          className={`history-chevron${collapsed ? "" : " history-chevron--open"}`}
          aria-hidden="true"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
        >
          ›
        </span>
      </div>

      {/* ── Body ── */}
      <div className={`history-panel__body${collapsed ? " history-panel__body--collapsed" : ""}`}>
        {count === 0 ? (
          <p className="history-empty">Generated passwords will appear here</p>
        ) : (
          <div className="history-list">
            {history.map((entry) => (
              <HistoryEntry
                key={entry.id}
                entry={entry}
                leavingId={leavingId}
                onCopy={onCopy}
                onDelete={onDelete}
                onRestore={onRestore}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
