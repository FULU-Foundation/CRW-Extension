import React from "react";

export const POPUP_CSS = {
  bg: "#004080",
  panel: "#004080",
  border: "rgba(255,255,255,0.25)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.82)",
  link: "#D8F1FF",
  buttonText: "#004080",
  buttonBg: "#FFFFFF",
  buttonBgHover: "#3056A9",
  divider: "rgba(255,255,255,0.25)",
  subtleBg: "rgba(255,255,255,0.08)",
  buttonSecondaryText: "#FFFFFF",
  buttonSecondaryBorder: "rgba(255,255,255,0.38)",
};

export const POPUP_LAYOUT = {
  root: {
    background: POPUP_CSS.bg,
    color: POPUP_CSS.text,
    border: `1px solid ${POPUP_CSS.border}`,
    borderRadius: "14px",
    boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
    fontFamily: "ui-sans-serif,system-ui,sans-serif",
    padding: "14px",
    lineHeight: 1.4,
    display: "flex",
    flexDirection: "column",
  } satisfies React.CSSProperties,
  headerRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  } satisfies React.CSSProperties,
  headerBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: 0,
  } satisfies React.CSSProperties,
  headerActions: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  } satisfies React.CSSProperties,
  bodyPanel: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: POPUP_CSS.panel,
    borderRadius: "10px",
    padding: "10px 0 6px 0",
    minHeight: 0,
  } satisfies React.CSSProperties,
  bodySection: {
    padding: "0 6px",
  } satisfies React.CSSProperties,
  footerActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    marginTop: "12px",
  } satisfies React.CSSProperties,
} as const;

export const ghostButtonHoverHandlers = {
  onMouseEnter: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.style.background = "rgba(255,255,255,0.24)";
  },
  onMouseLeave: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.style.background = "transparent";
  },
};
