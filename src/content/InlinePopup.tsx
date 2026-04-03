import { useState } from "react";

import type {
  AutoDismissCursorOutBehavior,
  PopupPosition,
} from "@/shared/constants";
import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";
import { getCurrentPopupPlacementStyle } from "@/content/popupPlacement";
import { PopupDismissBar } from "@/content/PopupDismissBar";

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

  const containerStyle = getCurrentPopupPlacementStyle(position);

  return (
    <div
      style={{ ...containerStyle, maxHeight: "60vh" }}
      onMouseEnter={() => setHovering(true)}
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
          autoDismissEnabled ? (
            <PopupDismissBar
              timeoutMs={autoDismissTimeoutMs}
              showProgressBar={autoDismissShowProgressBar}
              cursorOutBehavior={autoDismissCursorOutBehavior}
              hovering={hovering}
              onDismiss={onClose}
            />
          ) : undefined
        }
      />
    </div>
  );
};
