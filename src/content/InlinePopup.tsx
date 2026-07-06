import React from "react";

import type { PopupPosition } from "@/shared/constants";
import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";
import { getCurrentPopupPlacementStyle } from "@/content/popupPlacement";

type InlinePopupProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  settingsIconUrl: string;
  closeIconUrl: string;
  position: PopupPosition;
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

  const containerStyle = getCurrentPopupPlacementStyle(position);

  return (
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
      containerStyle={{
        ...containerStyle,
        maxHeight: "60vh",
      }}
    />
  );
};
