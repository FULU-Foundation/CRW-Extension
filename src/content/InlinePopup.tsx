import React, { useCallback, useEffect, useRef, useState } from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";
import { POPUP_CSS } from "@/shared/ui/matchPopupStyles";
import {
  type PillPosition,
  readPillPosition,
  writePillPosition,
} from "@/shared/storage";

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
const SAVE_DEBOUNCE_MS = 400;
// Approximate expanded card dimensions used for overflow detection
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
 * Given the pill's top-left position, return the top-left corner that the
 * expanded card should open from so it stays fully on-screen.
 *
 * Strategy: prefer to open down-right from the pill. If that would clip the
 * right/bottom edge, flip to open left and/or up instead.
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

  // Horizontal: open to the right if room, otherwise align right edge to pill right edge
  const spaceRight = vw - pillX;
  const x =
    spaceRight >= cardW + EDGE_MARGIN
      ? pillX
      : Math.max(EDGE_MARGIN, pillX + pillW - cardW);

  // Vertical: open downward if room, otherwise open upward from pill top
  const spaceBelow = vh - pillY;
  const y =
    spaceBelow >= cardH + EDGE_MARGIN
      ? pillY
      : Math.max(EDGE_MARGIN, pillY + pillH - cardH);

  return { x, y };
};

// ─── Shared drag hook ────────────────────────────────────────────────────────

type UseDragOptions = {
  initialPosition: PillPosition;
  elWidth: number;
  elHeight: number;
  onDragEnd: (pos: PillPosition) => void;
};

const useDrag = ({ initialPosition, elWidth, elHeight, onDragEnd }: UseDragOptions) => {
  const [position, setPosition] = useState<PillPosition>(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPointer = useRef<{ px: number; py: number } | null>(null);
  const dragStartPos = useRef<PillPosition>(initialPosition);
  const hasDragged = useRef(false);

  // Keep position in sync if initialPosition changes (e.g. loaded from storage)
  const isFirstSync = useRef(true);
  useEffect(() => {
    if (isFirstSync.current) {
      setPosition(initialPosition);
      dragStartPos.current = initialPosition;
      isFirstSync.current = false;
    }
  }, [initialPosition]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest("button")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragStartPointer.current = { px: e.clientX, py: e.clientY };
      dragStartPos.current = position;
      hasDragged.current = false;
      setIsDragging(true);
    },
    [position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragStartPointer.current) return;
      const dx = e.clientX - dragStartPointer.current.px;
      const dy = e.clientY - dragStartPointer.current.py;
      if (!hasDragged.current && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
      hasDragged.current = true;
      setPosition(
        clampPosition(
          dragStartPos.current.x + dx,
          dragStartPos.current.y + dy,
          elWidth,
          elHeight,
        ),
      );
    },
    [elWidth, elHeight],
  );

  const onPointerUp = useCallback(
    (_e: React.PointerEvent<HTMLElement>) => {
      if (!dragStartPointer.current) return;
      dragStartPointer.current = null;
      setIsDragging(false);
      if (hasDragged.current) onDragEnd(position);
      return hasDragged.current;
    },
    [position, onDragEnd],
  );

  return { position, setPosition, isDragging, hasDragged, onPointerDown, onPointerMove, onPointerUp };
};

// ─── Main component ──────────────────────────────────────────────────────────

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
  const [storedPosition, setStoredPosition] = useState<PillPosition | null>(null);
  const [cardPosition, setCardPosition] = useState<PillPosition | null>(null);

  const pillRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load persisted pill position on mount
  useEffect(() => {
    readPillPosition().then((saved) => {
      setStoredPosition(saved ?? DEFAULT_POSITION);
    });
  }, []);

  const persistPosition = useCallback((pos: PillPosition) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void writePillPosition(pos), SAVE_DEBOUNCE_MS);
  }, []);

  const { position: pillPosition, isDragging, hasDragged, onPointerDown, onPointerMove, onPointerUp } = useDrag({
    initialPosition: storedPosition ?? DEFAULT_POSITION,
    elWidth: pillRef.current?.offsetWidth ?? 220,
    elHeight: pillRef.current?.offsetHeight ?? 40,
    onDragEnd: (pos) => {
      setStoredPosition(pos);
      persistPosition(pos);
    },
  });

  const handlePillPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerUp(e);
      if (!hasDragged.current) {
        // It was a plain click — open the card
        const pill = pillRef.current;
        const pw = pill?.offsetWidth ?? 220;
        const ph = pill?.offsetHeight ?? 40;
        const cardPos = resolveCardPosition(pillPosition.x, pillPosition.y, pw, ph);
        setCardPosition(cardPos);
        setExpanded(true);
      }
    },
    [onPointerUp, hasDragged, pillPosition],
  );

  const topMatchName = matches[0]?.PageName ?? "Entry found";
  const incidentCount = matches.filter(
    (m) => "StartDate" in m || "Status" in m,
  ).length;

  if (storedPosition === null) return null;

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
        onPointerUp={handlePillPointerUp}
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

      {/* Expanded card — positioned smartly to stay on-screen */}
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
