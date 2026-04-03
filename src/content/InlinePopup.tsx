import { useRef, useState } from "react";

import type {
  AutoDismissCursorOutBehavior,
  PopupPosition,
} from "@/shared/constants";
import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";
import { getCurrentPopupPlacementStyle } from "@/content/popupPlacement";
import { PopupDismissBar } from "@/content/PopupDismissBar";

const FADE_DURATION_MS = 2000;

type InlinePopupProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  settingsIconUrl: string;
  closeIconUrl: string;
  position: PopupPosition;
  autoDismissEnabled: boolean;
  autoDismissTimeoutMs: number;
  autoDismissShowProgressBar: boolean;
  autoDismissCursorOutBehavior: AutoDismissCursorOutBehavior;
  manuallyOpened: boolean;
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
    position,
    autoDismissEnabled,
    autoDismissTimeoutMs,
    autoDismissShowProgressBar,
    autoDismissCursorOutBehavior,
    manuallyOpened,
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

  const [hovering, setHovering] = useState(false);
  const [fading, setFading] = useState(false);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDismiss = () => {
    setFading(true);
    fadeTimerRef.current = setTimeout(() => {
      onClose();
    }, FADE_DURATION_MS);
  };

  const handleMouseEnter = () => {
    if (fading) {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
      setFading(false);
    }
    setHovering(true);
  };

  const containerStyle = getCurrentPopupPlacementStyle(position);
  const showDismissBar = autoDismissEnabled && !manuallyOpened;
  // Subtract fade duration so the total time from popup open to fully gone equals autoDismissTimeoutMs.
  const barTimeoutMs = Math.max(0, autoDismissTimeoutMs - FADE_DURATION_MS);

  return (
    <div
      style={{
        ...containerStyle,
        maxHeight: "60vh",
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms ease`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setHovering(false)}
    >
      <MatchPopupCard
        matches={matches}
        logoUrl={logoUrl}
        externalIconUrl={externalIconUrl}
        onClose={onClose}
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
        containerStyle={{ maxHeight: "60vh" }}
        bottomSlot={
          showDismissBar ? (
            <PopupDismissBar
              timeoutMs={barTimeoutMs}
              showProgressBar={autoDismissShowProgressBar}
              cursorOutBehavior={autoDismissCursorOutBehavior}
              hovering={hovering}
              onDismiss={handleDismiss}
            />
          ) : undefined
        }
      />
    </div>
  );
};
