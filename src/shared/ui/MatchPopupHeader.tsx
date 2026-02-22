import React from "react";

import {
  POPUP_CSS,
  POPUP_LAYOUT,
  ghostButtonHoverHandlers,
} from "@/shared/ui/matchPopupStyles";

type MatchPopupHeaderProps = {
  logoUrl: string;
  domainLabel?: string;
  onOpenSettings?: () => void;
  settingsIconUrl?: string;
  closeIconUrl?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
};

export const MatchPopupHeader = (props: MatchPopupHeaderProps) => {
  const {
    logoUrl,
    domainLabel,
    onOpenSettings,
    settingsIconUrl,
    closeIconUrl,
    showCloseButton = false,
    onClose,
  } = props;

  const canShowSettingsButton = !!onOpenSettings && !!settingsIconUrl;
  const canShowCloseButton = showCloseButton && !!onClose && !!closeIconUrl;
  const showHeaderActions = canShowSettingsButton || canShowCloseButton;
  const headerRowStyle: React.CSSProperties = {
    ...POPUP_LAYOUT.headerRow,
    justifyContent: showHeaderActions ? "space-between" : "flex-start",
  };
  const headerIconButtonStyle: React.CSSProperties = {
    appearance: "none",
    border: 0,
    background: "transparent",
    color: POPUP_CSS.muted,
    margin: 0,
    width: "24px",
    height: "24px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "4px",
    cursor: "pointer",
    padding: 0,
    outline: "none",
    boxSizing: "border-box",
    flexShrink: 0,
  };

  return (
    <div style={headerRowStyle}>
      <div style={POPUP_LAYOUT.headerBrand}>
        <img
          src={logoUrl}
          alt="Consumer Rights Wiki"
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            flexShrink: 0,
            objectFit: "cover",
          }}
        />

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              color: POPUP_CSS.text,
              fontSize: "16px",
              lineHeight: 2.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Consumer Rights Wiki
          </div>
          {domainLabel && (
            <div style={{ fontSize: "10px", color: POPUP_CSS.muted }}>
              {domainLabel}
            </div>
          )}
        </div>
      </div>

      {showHeaderActions && (
        <div style={POPUP_LAYOUT.headerActions}>
          {canShowSettingsButton && (
            <button
              type="button"
              onClick={onOpenSettings}
              {...ghostButtonHoverHandlers}
              aria-label="Open extension settings"
              title="Open settings"
              style={headerIconButtonStyle}
            >
              <img
                src={settingsIconUrl}
                alt=""
                aria-hidden="true"
                style={{
                  width: "18px",
                  height: "18px",
                  display: "block",
                  filter: "brightness(0) saturate(100%) invert(100%)",
                  opacity: 0.82,
                }}
              />
            </button>
          )}
          {canShowCloseButton && (
            <button
              type="button"
              onClick={onClose}
              {...ghostButtonHoverHandlers}
              style={{
                ...headerIconButtonStyle,
              }}
            >
              <img
                src={closeIconUrl}
                alt=""
                aria-hidden="true"
                style={{
                  width: "18px",
                  height: "18px",
                  display: "block",
                  filter: "brightness(0) saturate(100%) invert(100%)",
                  opacity: 0.82,
                }}
              />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
