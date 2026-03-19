import React, { useState } from "react";
import browser from "webextension-polyfill";

import { CargoEntry, isIncidentEntry } from "@/shared/types";

type CompactBannerProps = {
  matches: CargoEntry[];
  logoUrl: string;
  onClose: () => void;
  onOpenSettings: () => void;
};

const getIncidentCount = (matches: CargoEntry[]): number => {
  return matches.filter((m) => isIncidentEntry(m)).length;
};

const getTotalCount = (matches: CargoEntry[]): number => {
  return matches.length;
};

const getBannerColor = (count: number): string => {
  if (count <= 0) return "#9E9E9E";
  if (count <= 1) return "#4CAF50";
  if (count <= 3) return "#FF9800";
  return "#FF5722";
};

const getSiteName = (hostname: string): string => {
  const parts = hostname.replace(/^www\./, "").split(".");
  if (parts.length >= 2) {
    return parts[0];
  }
  return hostname;
};

export const CompactBanner = (props: CompactBannerProps) => {
  const { matches, logoUrl, onClose, onOpenSettings } = props;
  const [showPopup, setShowPopup] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<ReturnType<
    typeof setTimeout
  > | null>(null);

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowPopup(false);
    }, 300);
    setHoverTimeout(timeout);
  };

  const handleMouseEnter = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }
    setShowPopup(true);
  };

  const incidentCount = getIncidentCount(matches);
  const totalCount = getTotalCount(matches);
  const hostname = matches[0]?.PageName || "this site";
  const siteName = getSiteName(hostname);
  const bannerColor = getBannerColor(incidentCount);
  const bannerOpacity = incidentCount > 0 ? 0.85 : 0.6;
  const incidents = matches.filter((m) => isIncidentEntry(m));

  return (
    <div
      style={{
        position: "fixed",
        top: "56px",
        right: "16px",
        width: "auto",
        maxWidth: "300px",
        height: "36px",
        backgroundColor: bannerColor,
        opacity: bannerOpacity,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 10px",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        fontSize: "12px",
        color: "#FFFFFF",
        zIndex: 2147483647,
        borderRadius: "8px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <img
          src={logoUrl}
          alt=""
          style={{ width: "18px", height: "18px", borderRadius: "4px" }}
        />
        <span style={{ fontWeight: 600 }}>{siteName}</span>
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            marginLeft: "4px",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFEB3B">
            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
          {incidentCount}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="#FFFFFF"
            opacity="0.9"
          >
            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
          </svg>
          {totalCount}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <button
          onClick={onOpenSettings}
          style={{
            background: "transparent",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            opacity: 0.8,
          }}
          title="Settings"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
        <button
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            opacity: 0.8,
          }}
          title="Close"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
      </div>

      {showPopup && incidents.length > 0 && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "absolute",
            top: "100%",
            right: "0",
            marginTop: "8px",
            width: "260px",
            maxHeight: "200px",
            overflowY: "auto",
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(8px)",
            borderRadius: "8px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            zIndex: 2147483647,
            padding: "6px 0",
          }}
        >
          <div
            style={{
              padding: "6px 12px",
              fontSize: "10px",
              fontWeight: 700,
              color: "#888",
              textTransform: "uppercase",
              borderBottom: "1px solid rgba(0,0,0,0.08)",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF9800">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
              </svg>
              {incidentCount} Incident{incidentCount !== 1 ? "s" : ""}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#666">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              {totalCount} Article{totalCount !== 1 ? "s" : ""}
            </span>
          </div>
          {incidents.map((match) => {
            const url = `https://consumerrights.wiki/${encodeURIComponent(match.PageName)}`;
            return (
              <div
                key={match.PageID}
                role="button"
                tabIndex={0}
                onClick={() => window.open(url, "_blank")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    window.open(url, "_blank");
                  }
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textDecoration: "none",
                  padding: "6px 12px",
                  cursor: "pointer",
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "#222",
                    fontWeight: 500,
                    lineHeight: 1.3,
                  }}
                >
                  {match.PageName}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
