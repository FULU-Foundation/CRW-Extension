import React from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupCard } from "@/shared/ui/MatchPopupCard";

type InlinePopupProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  onClose: () => void;
  onSuppressSite: () => void;
  onDisableWarnings?: () => void;
  suppressButtonLabel?: string;
  disableWarningsLabel?: string;
};

export const InlinePopup = (props: InlinePopupProps) => {
  const {
    matches,
    logoUrl,
    externalIconUrl,
    onClose,
    onSuppressSite,
    onDisableWarnings,
    suppressButtonLabel,
    disableWarningsLabel,
  } = props;

  return (
    <MatchPopupCard
      matches={matches}
      logoUrl={logoUrl}
      externalIconUrl={externalIconUrl}
      onClose={onClose}
      onSuppressSite={onSuppressSite}
      onDisableWarnings={onDisableWarnings}
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
