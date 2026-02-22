import React from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";

type InlinePopupProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  settingsIconUrl: string;
  onClose: () => void;
  onOpenSettings: () => void;
  onSuppressSite: () => void;
  onSuppressPageName?: () => void;
  onDisableWarnings?: () => void;
  suppressPageNameLabel?: string;
  suppressButtonLabel?: string;
  disableWarningsLabel?: string;
};

export const InlinePopup = (props: InlinePopupProps) => {
  const {
    matches,
    logoUrl,
    externalIconUrl,
    settingsIconUrl,
    onClose,
    onOpenSettings,
    onSuppressSite,
    onSuppressPageName,
    onDisableWarnings,
    suppressPageNameLabel,
    suppressButtonLabel,
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
      onSuppressSite={onSuppressSite}
      onSuppressPageName={onSuppressPageName}
      onDisableWarnings={onDisableWarnings}
      suppressPageNameLabel={suppressPageNameLabel}
      suppressButtonLabel={suppressButtonLabel}
      disableWarningsLabel={disableWarningsLabel}
      showCloseButton
      hideRelatedButtonWhenEmpty
      containerStyle={{
        position: "fixed",
        right: "16px",
        bottom: "16px",
        width: "460px",
        maxWidth: "calc(100vw - 32px)",
        zIndex: 2147483647,
        maxHeight: "60vh",
      }}
    />
  );
};
