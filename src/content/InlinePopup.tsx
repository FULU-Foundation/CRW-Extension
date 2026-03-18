import React, { useState } from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";
import { POPUP_CSS } from "@/shared/ui/matchPopupStyles";

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

  const topMatchName = matches[0]?.PageName ?? "Entry found";
  const incidentCount = matches.filter(
    (m) => "StartDate" in m || "Status" in m,
  ).length;

  if (!expanded) {
    return (
      <div
        style={{
          position: "fixed",
          right: "16px",
          bottom: "16px",
          zIndex: 2147483647,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: POPUP_CSS.bg,
          border: `1px solid ${POPUP_CSS.border}`,
          borderRadius: "999px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.35)",
          padding: "8px 14px 8px 10px",
          fontFamily: "ui-sans-serif,system-ui,sans-serif",
          cursor: "pointer",
          userSelect: "none",
          maxWidth: "calc(100vw - 32px)",
        }}
        onClick={() => setExpanded(true)}
        title="Click to view Consumer Rights Wiki entry"
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 6px 20px rgba(0,0,0,0.5)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            "0 4px 16px rgba(0,0,0,0.35)";
        }}
      >
        {/* Logo */}
        <img
          src={logoUrl}
          alt="CRW"
          style={{ width: "20px", height: "20px", flexShrink: 0 }}
        />

        {/* Label */}
        <span
          style={{
            color: POPUP_CSS.text,
            fontSize: "13px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "200px",
          }}
        >
          {topMatchName}
        </span>

        {/* Incident badge */}
        {incidentCount > 0 && (
          <span
            style={{
              background: "#e05c2a",
              color: "#fff",
              fontSize: "11px",
              fontWeight: 700,
              borderRadius: "999px",
              padding: "1px 7px",
              flexShrink: 0,
              lineHeight: "18px",
            }}
          >
            {incidentCount} incident{incidentCount !== 1 ? "s" : ""}
          </span>
        )}

        {/* Expand chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.7)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0, marginLeft: "2px" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>

        {/* Dismiss */}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            border: 0,
            background: "transparent",
            color: "rgba(255,255,255,0.6)",
            fontSize: "16px",
            lineHeight: 1,
            cursor: "pointer",
            padding: "0 0 0 4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.6)";
          }}
        >
          ×
        </button>
      </div>
    );
  }

  return (
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
        right: "16px",
        bottom: "16px",
        width: "460px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 2147483647,
        maxHeight: "60vh",
      }}
    />
  );
};
