import React from "react";

const POPUP_EDGE_OFFSET_PX = 16;
const TABLET_MAX_WIDTH_PX = 1024;

type PopupPlacementEnvironment = {
  userAgent?: string;
  maxTouchPoints?: number;
  hasCoarsePointer?: boolean;
  viewportWidth?: number;
  viewportHeight?: number;
};

const MOBILE_OR_TABLET_USER_AGENT =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet|Silk|Kindle/i;

const isMobileOrTabletEnvironment = ({
  userAgent = "",
  maxTouchPoints = 0,
  hasCoarsePointer = false,
  viewportWidth = Number.POSITIVE_INFINITY,
  viewportHeight = Number.POSITIVE_INFINITY,
}: PopupPlacementEnvironment): boolean => {
  if (MOBILE_OR_TABLET_USER_AGENT.test(userAgent)) return true;

  const hasTouchInput = maxTouchPoints > 0;
  const withinTabletBounds =
    Math.min(viewportWidth, viewportHeight) <= TABLET_MAX_WIDTH_PX;
  return hasCoarsePointer && hasTouchInput && withinTabletBounds;
};

export const shouldPlacePopupAtBottom = (
  environment: PopupPlacementEnvironment = {},
): boolean => {
  return isMobileOrTabletEnvironment(environment);
};

export const getInlinePopupPlacementStyle = (
  environment: PopupPlacementEnvironment = {},
): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: "fixed",
    width: "460px",
    maxWidth: "calc(100vw - 32px)",
    zIndex: 2147483647,
  };

  if (!shouldPlacePopupAtBottom(environment)) {
    return {
      ...baseStyle,
      right: `${POPUP_EDGE_OFFSET_PX}px`,
      top: `${POPUP_EDGE_OFFSET_PX}px`,
    };
  }

  return {
    ...baseStyle,
    left: "50%",
    bottom: `${POPUP_EDGE_OFFSET_PX}px`,
    transform: "translateX(-50%)",
  };
};

export const getCurrentPopupPlacementStyle = (): React.CSSProperties => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return getInlinePopupPlacementStyle();
  }

  return getInlinePopupPlacementStyle({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    hasCoarsePointer: window.matchMedia("(pointer: coarse)").matches,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
};
