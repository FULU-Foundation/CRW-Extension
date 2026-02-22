import React, { useMemo, useState } from "react";

import { CargoEntry } from "@/shared/types";
import { MatchPopupBody } from "@/shared/ui/MatchPopupBody";
import { MatchPopupFooterActions } from "@/shared/ui/MatchPopupFooterActions";
import { MatchPopupHeader } from "@/shared/ui/MatchPopupHeader";
import { POPUP_CSS, POPUP_LAYOUT } from "@/shared/ui/matchPopupStyles";

type MatchPopupCardProps = {
  matches: CargoEntry[];
  logoUrl: string;
  externalIconUrl: string;
  onSuppressSite: () => void;
  onSuppressPageName?: () => void;
  onDisableWarnings?: () => void;
  onClose?: () => void;
  domainLabel?: string;
  showCloseButton?: boolean;
  hideRelatedButtonWhenEmpty?: boolean;
  containerStyle?: React.CSSProperties;
  suppressButtonLabel?: string;
  suppressPageNameLabel?: string;
  disableWarningsLabel?: string;
  onOpenSettings?: () => void;
  settingsIconUrl?: string;
  closeIconUrl?: string;
};

const VISIBLE_INCIDENT_LIMIT = 4;

const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

const normalizeEntityToken = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
};

const toNormalizedReferenceSet = (value: unknown): Set<string> => {
  if (typeof value !== "string") return new Set<string>();
  const normalized = value
    .split(/[,;|]/)
    .map((piece) => normalizeEntityToken(piece))
    .filter(Boolean);
  return new Set(normalized);
};

const addIfPresent = (target: Set<string>, value: unknown) => {
  if (typeof value !== "string") return;
  const normalized = normalizeEntityToken(value);
  if (!normalized) return;
  target.add(normalized);
};

const getIncidentPrimaryStatus = (entry: CargoEntry): string => {
  if (typeof entry.Status !== "string") return "";
  const [primaryStatus] = entry.Status.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return primaryStatus || "";
};

const isActiveIncident = (entry: CargoEntry): boolean => {
  return getIncidentPrimaryStatus(entry).toLowerCase() === "active";
};

const parseStartDateMs = (entry: CargoEntry): number => {
  if (typeof entry.StartDate !== "string") return Number.NEGATIVE_INFINITY;
  const value = Date.parse(entry.StartDate);
  if (Number.isNaN(value)) return Number.NEGATIVE_INFINITY;
  return value;
};

type IncidentFocus = {
  companyNames: Set<string>;
  productNames: Set<string>;
  productLineNames: Set<string>;
};

const getIncidentFocus = (
  topMatch: CargoEntry | undefined,
  companyMatch: CargoEntry | undefined,
): IncidentFocus => {
  const companyNames = new Set<string>();
  const productNames = new Set<string>();
  const productLineNames = new Set<string>();

  if (topMatch) {
    if (topMatch._type === "Company")
      addIfPresent(companyNames, topMatch.PageName);
    if (topMatch._type === "Product")
      addIfPresent(productNames, topMatch.PageName);
    if (topMatch._type === "ProductLine")
      addIfPresent(productLineNames, topMatch.PageName);
    addIfPresent(companyNames, topMatch.Company);
    addIfPresent(productLineNames, topMatch.ProductLine);
    addIfPresent(productNames, topMatch.Product);
  }

  if (companyMatch) addIfPresent(companyNames, companyMatch.PageName);

  return { companyNames, productNames, productLineNames };
};

const hasIntersection = (left: Set<string>, right: Set<string>): boolean => {
  for (const value of left) {
    if (right.has(value)) return true;
  }
  return false;
};

const getIncidentRelevanceTier = (
  incident: CargoEntry,
  focus: IncidentFocus,
): number => {
  const incidentCompanyRefs = toNormalizedReferenceSet(incident.Company);
  const incidentProductRefs = toNormalizedReferenceSet(incident.Product);
  const incidentProductLineRefs = toNormalizedReferenceSet(
    incident.ProductLine,
  );

  const productHit = hasIntersection(incidentProductRefs, focus.productNames);
  const productLineHit = hasIntersection(
    incidentProductLineRefs,
    focus.productLineNames,
  );
  if (productHit || productLineHit) return 0;

  const companyHit = hasIntersection(incidentCompanyRefs, focus.companyNames);
  if (companyHit) return 1;

  return 2;
};

const sortIncidents = (
  entries: CargoEntry[],
  focus: IncidentFocus,
): CargoEntry[] => {
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const leftTier = getIncidentRelevanceTier(left.entry, focus);
      const rightTier = getIncidentRelevanceTier(right.entry, focus);
      if (leftTier !== rightTier) return leftTier - rightTier;

      const leftActive = isActiveIncident(left.entry);
      const rightActive = isActiveIncident(right.entry);
      if (leftActive !== rightActive) return rightActive ? 1 : -1;

      const leftStart = parseStartDateMs(left.entry);
      const rightStart = parseStartDateMs(right.entry);
      if (leftStart !== rightStart) return rightStart - leftStart;

      return left.index - right.index;
    })
    .map((row) => row.entry);
};

const getSuppressScopeLabel = (entry: CargoEntry): string => {
  if (entry._type === "ProductLine") return "product";
  return entry._type.toLowerCase();
};

export const MatchPopupCard = (props: MatchPopupCardProps) => {
  const {
    matches,
    logoUrl,
    externalIconUrl,
    onSuppressSite,
    onSuppressPageName,
    onDisableWarnings,
    onClose,
    domainLabel,
    showCloseButton = false,
    hideRelatedButtonWhenEmpty = false,
    containerStyle,
    suppressButtonLabel = "Hide for this site",
    suppressPageNameLabel,
    disableWarningsLabel = "Don't show me this again",
    onOpenSettings,
    settingsIconUrl,
    closeIconUrl,
  } = props;

  const [showRelatedPages, setShowRelatedPages] = useState(false);

  const derived = useMemo(() => {
    const topMatch = matches[0];
    const topMatchKey = topMatch ? getEntryKey(topMatch) : "";
    const relatedItems = matches.filter(
      (item) => getEntryKey(item) !== topMatchKey,
    );
    const groupedRelated = {
      Incident: [] as CargoEntry[],
      Product: relatedItems.filter((item) => item._type === "Product"),
      ProductLine: relatedItems.filter((item) => item._type === "ProductLine"),
    };
    const companyMatch = matches.find((item) => item._type === "Company");
    const incidentFocus = getIncidentFocus(topMatch, companyMatch);
    groupedRelated.Incident = sortIncidents(
      relatedItems.filter((item) => item._type === "Incident"),
      incidentFocus,
    );
    const hiddenRelatedPagesCount =
      Math.max(groupedRelated.Incident.length - VISIBLE_INCIDENT_LIMIT, 0) +
      groupedRelated.Product.length +
      groupedRelated.ProductLine.length;
    return {
      topMatch,
      groupedRelated,
      hiddenRelatedPagesCount,
      companyMatch,
    };
  }, [matches]);

  if (!derived.topMatch) return null;

  const visibleIncidents = derived.groupedRelated.Incident.slice(
    0,
    VISIBLE_INCIDENT_LIMIT,
  );
  const expandedIncidents = derived.groupedRelated.Incident.slice(
    VISIBLE_INCIDENT_LIMIT,
  );
  const showsRelatedPagesToggle =
    !hideRelatedButtonWhenEmpty || derived.hiddenRelatedPagesCount > 0;
  const resolvedSuppressPageNameLabel =
    suppressPageNameLabel ||
    `Hide for this ${getSuppressScopeLabel(derived.topMatch)}`;

  return (
    <div
      style={{
        ...POPUP_LAYOUT.root,
        ...containerStyle,
      }}
    >
      <MatchPopupHeader
        logoUrl={logoUrl}
        domainLabel={domainLabel}
        onOpenSettings={onOpenSettings}
        settingsIconUrl={settingsIconUrl}
        closeIconUrl={closeIconUrl}
        showCloseButton={showCloseButton}
        onClose={onClose}
      />

      <MatchPopupBody
        topMatch={derived.topMatch}
        companyMatch={derived.companyMatch}
        externalIconUrl={externalIconUrl}
        visibleIncidents={visibleIncidents}
        expandedIncidents={expandedIncidents}
        relatedProducts={derived.groupedRelated.Product}
        relatedProductLines={derived.groupedRelated.ProductLine}
        showsRelatedPagesToggle={showsRelatedPagesToggle}
        hiddenRelatedPagesCount={derived.hiddenRelatedPagesCount}
        showRelatedPages={showRelatedPages}
        onToggleRelatedPages={() => setShowRelatedPages((value) => !value)}
      />

      <MatchPopupFooterActions
        onSuppressPageName={onSuppressPageName}
        suppressPageNameLabel={resolvedSuppressPageNameLabel}
        onSuppressSite={onSuppressSite}
        suppressButtonLabel={suppressButtonLabel}
      />

      {onDisableWarnings && (
        <div style={{ marginTop: "8px", textAlign: "center" }}>
          <button
            type="button"
            onClick={onDisableWarnings}
            style={{
              border: 0,
              background: "transparent",
              color: POPUP_CSS.muted,
              fontSize: "12px",
              lineHeight: 1.2,
              textDecoration: "underline",
              cursor: "pointer",
              padding: 0,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.color = POPUP_CSS.link;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.color = POPUP_CSS.muted;
            }}
          >
            {disableWarningsLabel}
          </button>
        </div>
      )}
    </div>
  );
};
