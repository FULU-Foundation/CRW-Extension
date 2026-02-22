import React from "react";

import {
  POPUP_CSS,
  POPUP_LAYOUT,
  ghostButtonHoverHandlers,
} from "@/shared/ui/matchPopupStyles";

type MatchPopupHeaderProps = {
  logoUrl: string;
  logoError: boolean;
  onLogoError: () => void;
  domainLabel?: string;
  onOpenSettings?: () => void;
  settingsIconUrl?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
};

export const MatchPopupHeader = (props: MatchPopupHeaderProps) => {
  const {
    logoUrl,
    logoError,
    onLogoError,
    domainLabel,
    onOpenSettings,
    settingsIconUrl,
    showCloseButton = false,
    onClose,
  } = props;

  const showHeaderActions = showCloseButton || !!onOpenSettings;
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
    width: "22px",
    height: "22px",
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
        {!logoError && (
          <img
            src={logoUrl}
            alt="CRW"
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              flexShrink: 0,
              objectFit: "cover",
            }}
            onError={onLogoError}
          />
        )}
        {logoError && (
          <span
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "6px",
              flexShrink: 0,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: POPUP_CSS.panel,
              color: POPUP_CSS.link,
              fontSize: "6px",
              fontWeight: 700,
              letterSpacing: "0.4px",
            }}
          >
            CRW
          </span>
        )}

        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              color: POPUP_CSS.text,
              fontSize: "12px",
              lineHeight: 1.2,
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
          {onOpenSettings && settingsIconUrl && (
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
          {showCloseButton && onClose && (
            <button
              type="button"
              onClick={onClose}
              {...ghostButtonHoverHandlers}
              style={{
                ...headerIconButtonStyle,
                fontSize: "24px",
                lineHeight: 1,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "block",
                  lineHeight: 1,
                }}
              >
                ×
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
