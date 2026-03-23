import React, { useCallback, useRef, useState } from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";
import { POPUP_CSS } from "@/shared/ui/matchPopupStyles";

type PillPosition = { x: number; y: number };

type InlinePopupProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  settingsIconUrl: string;
  closeIconUrl: string;
  onClose: () => void;
  onOpenSettings: () => void;
  onSuppressSite: () => void;
  onSnoozeUntilNewChanges?: () => void;
  onDisableWarnings?: () => void;
  snoozeUntilNewChangesLabel?: string;
  snoozeUntilNewChangesTooltip?: string;
  suppressButtonLabel?: string;
  suppressButtonTooltip?: string;
  disableWarningsLabel?: string;
};

const DEFAULT_POSITION: PillPosition = { x: 16, y: 16 };
const CARD_WIDTH = 460;
const CARD_HEIGHT = 420;
const EDGE_MARGIN = 8;

const clampPosition = (
  x: number,
  y: number,
  elWidth: number,
  elHeight: number,
): PillPosition => ({
  x: Math.max(EDGE_MARGIN, Math.min(x, window.innerWidth - elWidth - EDGE_MARGIN)),
  y: Math.max(EDGE_MARGIN, Math.min(y, window.innerHeight - elHeight - EDGE_MARGIN)),
});

/**
 * Given the pill's position and size, pick a card position that stays
 * fully on-screen. Opens down-right by default; flips left/up when near
 * the right/bottom edges.
 */
const resolveCardPosition = (
  pillX: number,
  pillY: number,
  pillW: number,
  pillH: number,
): PillPosition => {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cardW = Math.min(CARD_WIDTH, vw - EDGE_MARGIN * 2);
  const cardH = Math.min(CARD_HEIGHT, vh - EDGE_MARGIN * 2);

  const x =
    vw - pillX >= cardW + EDGE_MARGIN
      ? pillX
      : Math.max(EDGE_MARGIN, pillX + pillW - cardW);

  const y =
    vh - pillY >= cardH + EDGE_MARGIN
      ? pillY
      : Math.max(EDGE_MARGIN, pillY + pillH - cardH);

  return { x, y };
};

export const InlinePopup = (props: InlinePopupProps) => {
  const {
    matches,
    logoUrl,
    externalIconUrl,
    settingsIconUrl,
    closeIconUrl,
    onClose,
    onOpenSettings,
    onSuppressSite,
    onSnoozeUntilNewChanges,
    onDisableWarnings,
    snoozeUntilNewChangesLabel,
    snoozeUntilNewChangesTooltip,
    suppressButtonLabel,
    suppressButtonTooltip,
    disableWarningsLabel,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const [pillPosition, setPillPosition] = useState<PillPosition>(DEFAULT_POSITION);
  const [cardPosition, setCardPosition] = useState<PillPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const pillRef = useRef<HTMLDivElement>(null);
  const dragStartPointer = useRef<{ px: number; py: number } | null>(null);
  const dragStartPos = useRef<PillPosition>(DEFAULT_POSITION);
  const hasDragged = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartPointer.current = { px: e.clientX, py: e.clientY };
      dragStartPos.current = pillPosition;
      hasDragged.current = false;
      setIsDragging(true);
    },
    [pillPosition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartPointer.current) return;
      const dx = e.clientX - dragStartPointer.current.px;
      const dy = e.clientY - dragStartPointer.current.py;
      if (!hasDragged.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      hasDragged.current = true;
      const el = pillRef.current;
      setPillPosition(
        clampPosition(
          dragStartPos.current.x + dx,
          dragStartPos.current.y + dy,
          el?.offsetWidth ?? 220,
          el?.offsetHeight ?? 40,
        ),
      );
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragStartPointer.current) return;
      dragStartPointer.current = null;
      setIsDragging(false);
      if (!hasDragged.current) {
        // Plain click — compute where the card should open and expand
        const pill = pillRef.current;
        const pw = pill?.offsetWidth ?? 220;
        const ph = pill?.offsetHeight ?? 40;
        setCardPosition(resolveCardPosition(pillPosition.x, pillPosition.y, pw, ph));
        setExpanded(true);
      }
    },
    [pillPosition],
  );

  const topMatchName = matches[0]?.PageName ?? "Entry found";
  const incidentCount = matches.filter(
    (m) => "StartDate" in m || "Status" in m,
  ).length;

  const pillStyle: React.CSSProperties = {
    position: "fixed",
    left: `${pillPosition.x}px`,
    top: `${pillPosition.y}px`,
    zIndex: 2147483647,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: POPUP_CSS.bg,
    border: `1px solid ${POPUP_CSS.border}`,
    borderRadius: "999px",
    boxShadow: isDragging ? "0 8px 24px rgba(0,0,0,0.5)" : "0 4px 16px rgba(0,0,0,0.35)",
    padding: "8px 14px 8px 10px",
    fontFamily: "ui-sans-serif,system-ui,sans-serif",
    cursor: isDragging ? "grabbing" : "grab",
    userSelect: "none",
    maxWidth: "calc(100vw - 32px)",
    touchAction: "none",
  };

  return (
    <>
      {/* Pill — always visible */}
      <div
        ref={pillRef}
        style={pillStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="Drag to move · Click to expand"
      >
        {/* Drag handle dots */}
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,0.45)" style={{ flexShrink: 0 }}>
          <circle cx="9" cy="6" r="2" /><circle cx="15" cy="6" r="2" />
          <circle cx="9" cy="12" r="2" /><circle cx="15" cy="12" r="2" />
          <circle cx="9" cy="18" r="2" /><circle cx="15" cy="18" r="2" />
        </svg>

        {/* Logo */}
        <img src={logoUrl} alt="CRW" style={{ width: "20px", height: "20px", flexShrink: 0 }} />

        {/* Label */}
        <span style={{ color: POPUP_CSS.text, fontSize: "13px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
          {topMatchName}
        </span>

        {/* Incident badge */}
        {incidentCount > 0 && (
          <span style={{ background: "#e05c2a", color: "#fff", fontSize: "11px", fontWeight: 700, borderRadius: "999px", padding: "1px 7px", flexShrink: 0, lineHeight: "18px" }}>
            {incidentCount} incident{incidentCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Chevron */}
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginLeft: "2px" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>

        {/* Dismiss */}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          style={{ border: 0, background: "transparent", color: "rgba(255,255,255,0.6)", fontSize: "16px", lineHeight: 1, cursor: "pointer", padding: "0 0 0 4px", flexShrink: 0, display: "flex", alignItems: "center" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
        >×</button>
      </div>

      {/* Expanded card — smart-positioned to stay fully on screen */}
      {expanded && cardPosition !== null && (
        <MatchPopupCard
          matches={matches}
          logoUrl={logoUrl}
          externalIconUrl={externalIconUrl}
          onClose={() => setExpanded(false)}
          onOpenSettings={onOpenSettings}
          settingsIconUrl={settingsIconUrl}
          closeIconUrl={closeIconUrl}
          onSuppressSite={onSuppressSite}
          onSnoozeUntilNewChanges={onSnoozeUntilNewChanges}
          onDisableWarnings={onDisableWarnings}
          snoozeUntilNewChangesLabel={snoozeUntilNewChangesLabel}
          snoozeUntilNewChangesTooltip={snoozeUntilNewChangesTooltip}
          suppressButtonLabel={suppressButtonLabel}
          suppressButtonTooltip={suppressButtonTooltip}
          disableWarningsLabel={disableWarningsLabel}
          showCloseButton
          hideRelatedButtonWhenEmpty
          containerStyle={{
            position: "fixed",
            left: `${cardPosition.x}px`,
            top: `${cardPosition.y}px`,
            width: `${CARD_WIDTH}px`,
            maxWidth: "calc(100vw - 32px)",
            zIndex: 2147483647,
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        />
      )}
    </>
  );
};
