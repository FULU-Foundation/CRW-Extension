import React from "react";

type InlineEmptyStateProps = {
  logoUrl: string;
  onClose: () => void;
};

export const InlineEmptyState = (props: InlineEmptyStateProps) => {
  const { logoUrl, onClose } = props;

  return (
    <div
      style={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        width: "460px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 2147483647,
        background: "#004080",
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.25)",
        borderRadius: "14px",
        boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
        padding: "14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img
            src={logoUrl}
            alt="CRW"
            style={{
              width: "24px",
              height: "24px",
              borderRadius: "6px",
              flexShrink: 0,
            }}
          />
          <div style={{ fontSize: "14px", fontWeight: 700, lineHeight: 1.2 }}>
            Consumer Rights Wiki
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            border: 0,
            background: "transparent",
            color: "rgba(255,255,255,0.82)",
            width: "32px",
            height: "32px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            lineHeight: "24px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          ×
        </button>
      </div>
      <div
        style={{
          marginTop: "12px",
          border: "1px solid rgba(255,255,255,0.25)",
          borderRadius: "10px",
          background: "rgba(255,255,255,0.08)",
          padding: "12px",
          fontSize: "14px",
          lineHeight: 1.35,
          textAlign: "center",
        }}
      >
        There are no matching arcitcles.
      </div>
    </div>
  );
};
