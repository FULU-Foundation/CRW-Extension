import React, { useState } from "react";

import {
  POPUP_CSS,
  POPUP_LAYOUT,
  ghostButtonHoverHandlers,
} from "@/shared/ui/matchPopupStyles";

type MatchPopupFooterActionsProps = {
  onSnoozeUntilNewChanges?: () => void;
  snoozeUntilNewChangesLabel: string;
  snoozeUntilNewChangesTooltip?: string;
  onSuppressSite: () => void;
  suppressButtonLabel: string;
  suppressButtonTooltip: string;
};

export const MatchPopupFooterActions = (
  props: MatchPopupFooterActionsProps,
) => {
  const {
    onSnoozeUntilNewChanges,
    snoozeUntilNewChangesLabel,
    snoozeUntilNewChangesTooltip,
    onSuppressSite,
    suppressButtonLabel,
    suppressButtonTooltip,
  } = props;
  const [activeTooltip, setActiveTooltip] = useState<
    "snooze" | "suppress" | null
  >(null);

  const secondaryActionButtonStyle: React.CSSProperties = {
    appearance: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "32px",
    margin: 0,
    border: `1px solid ${POPUP_CSS.buttonSecondaryBorder}`,
    background: "transparent",
    color: POPUP_CSS.buttonSecondaryText,
    borderRadius: "10px",
    boxSizing: "border-box",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
    outline: "none",
    cursor: "pointer",
  };

  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    left: "50%",
    bottom: "calc(100% + 8px)",
    transform: "translateX(-50%)",
    zIndex: 30,
    width: "max-content",
    maxWidth: "240px",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1px solid rgba(216,241,255,0.22)",
    background:
      "linear-gradient(180deg, rgba(7,18,41,0.98), rgba(6,15,35,0.94))",
    boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
    color: POPUP_CSS.text,
    fontSize: "11px",
    lineHeight: 1.35,
    textAlign: "center",
    pointerEvents: "none",
  };

  const tooltipArrowStyle: React.CSSProperties = {
    position: "absolute",
    bottom: "-6px",
    left: "50%",
    width: "10px",
    height: "10px",
    marginLeft: "-5px",
    background: "rgba(6,15,35,0.96)",
    borderRight: "1px solid rgba(216,241,255,0.22)",
    borderBottom: "1px solid rgba(216,241,255,0.22)",
    transform: "rotate(45deg)",
  };

  return (
    <div style={POPUP_LAYOUT.footerActions}>
      {onSnoozeUntilNewChanges && (
        <div style={{ position: "relative", display: "inline-flex" }}>
          <button
            type="button"
            onClick={onSnoozeUntilNewChanges}
            onMouseEnter={(event) => {
              setActiveTooltip("snooze");
              ghostButtonHoverHandlers.onMouseEnter(event);
            }}
            onMouseLeave={(event) => {
              setActiveTooltip(null);
              ghostButtonHoverHandlers.onMouseLeave(event);
            }}
            onFocus={() => {
              setActiveTooltip("snooze");
            }}
            onBlur={() => {
              setActiveTooltip(null);
            }}
            style={secondaryActionButtonStyle}
          >
            {snoozeUntilNewChangesLabel}
          </button>
          {activeTooltip === "snooze" && snoozeUntilNewChangesTooltip && (
            <div role="tooltip" style={tooltipStyle}>
              <div style={tooltipArrowStyle} aria-hidden="true" />
              {snoozeUntilNewChangesTooltip}
            </div>
          )}
        </div>
      )}

      <div style={{ position: "relative", display: "inline-flex" }}>
        <button
          type="button"
          onClick={onSuppressSite}
          onMouseEnter={(event) => {
            setActiveTooltip("suppress");
            ghostButtonHoverHandlers.onMouseEnter(event);
          }}
          onMouseLeave={(event) => {
            setActiveTooltip(null);
            ghostButtonHoverHandlers.onMouseLeave(event);
          }}
          onFocus={() => {
            setActiveTooltip("suppress");
          }}
          onBlur={() => {
            setActiveTooltip(null);
          }}
          style={secondaryActionButtonStyle}
        >
          {suppressButtonLabel}
        </button>
        {activeTooltip === "suppress" && (
          <div role="tooltip" style={tooltipStyle}>
            <div style={tooltipArrowStyle} aria-hidden="true" />
            {suppressButtonTooltip}
          </div>
        )}
      </div>
    </div>
  );
};
