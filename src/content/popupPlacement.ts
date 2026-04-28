import React from "react";

import type { PopupPosition } from "@/shared/constants";
import { DEFAULT_POPUP_POSITION } from "@/shared/constants";

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
  position: PopupPosition = DEFAULT_POPUP_POSITION,
  environment: PopupPlacementEnvironment = {},
): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {
    position: "fixed",
    width: "460px",
    maxWidth: "calc(100vw - 32px)",
    zIndex: 2147483647,
  };

  if (shouldPlacePopupAtBottom(environment)) {
    return {
      ...baseStyle,
      left: "50%",
      bottom: `${POPUP_EDGE_OFFSET_PX}px`,
      transform: "translateX(-50%)",
    };
  }

  const isBottom = position === "bottom-left" || position === "bottom-right";
  const isLeft = position === "top-left" || position === "bottom-left";

  return {
    ...baseStyle,
    ...(isBottom
      ? { bottom: `${POPUP_EDGE_OFFSET_PX}px` }
      : { top: `${POPUP_EDGE_OFFSET_PX}px` }),
    ...(isLeft
      ? { left: `${POPUP_EDGE_OFFSET_PX}px` }
      : { right: `${POPUP_EDGE_OFFSET_PX}px` }),
  };
};

export const getCurrentPopupPlacementStyle = (
  position: PopupPosition = DEFAULT_POPUP_POSITION,
): React.CSSProperties => {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return getInlinePopupPlacementStyle(position);
  }

  return getInlinePopupPlacementStyle(position, {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    hasCoarsePointer: window.matchMedia("(pointer: coarse)").matches,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  });
};
