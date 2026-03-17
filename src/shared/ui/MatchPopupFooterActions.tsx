import React from "react";

import {
  POPUP_CSS,
  POPUP_LAYOUT,
  ghostButtonHoverHandlers,
} from "@/shared/ui/matchPopupStyles";

type MatchPopupFooterActionsProps = {
  onSnoozeUntilNewChanges?: () => void;
  snoozeUntilNewChangesLabel: string;
  onSuppressSite: () => void;
  suppressButtonLabel: string;
};

export const MatchPopupFooterActions = (
  props: MatchPopupFooterActionsProps,
) => {
  const {
    onSnoozeUntilNewChanges,
    snoozeUntilNewChangesLabel,
    onSuppressSite,
    suppressButtonLabel,
  } = props;

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

  return (
    <div style={POPUP_LAYOUT.footerActions}>
      {onSnoozeUntilNewChanges && (
        <button
          type="button"
          onClick={onSnoozeUntilNewChanges}
          {...ghostButtonHoverHandlers}
          style={secondaryActionButtonStyle}
        >
          {snoozeUntilNewChangesLabel}
        </button>
      )}

      <button
        type="button"
        onClick={onSuppressSite}
        {...ghostButtonHoverHandlers}
        style={secondaryActionButtonStyle}
      >
        {suppressButtonLabel}
      </button>
    </div>
  );
};
