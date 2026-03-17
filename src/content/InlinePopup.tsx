import React from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";

type InlinePopupProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  settingsIconUrl: string;
  closeIconUrl: string;
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
        position: "fixed",
        right: "16px",
        top: "16px",
        width: "460px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 2147483647,
        maxHeight: "60vh",
      }}
    />
  );
};
