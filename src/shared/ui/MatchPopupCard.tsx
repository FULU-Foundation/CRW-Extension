import React, { useMemo, useState } from "react";
import { CargoEntry } from "@/shared/types";

const POPUP_CSS = {
  bg: "#004080",
  panel: "#004080",
  border: "rgba(255,255,255,0.25)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.82)",
  link: "#D8F1FF",
  buttonText: "#004080",
  buttonBg: "#FFFFFF",
  buttonBgHover: "#3056A9",
  divider: "rgba(255,255,255,0.25)",
  subtleBg: "rgba(255,255,255,0.08)",
  buttonSecondaryText: "#FFFFFF",
  buttonSecondaryBorder: "rgba(255,255,255,0.38)",
};

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
};

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

const shouldShowExternalIcon = (entry: CargoEntry): boolean => {
  return (
    entry._type === "Company" ||
    entry._type === "Incident" ||
    entry._type === "Product" ||
    entry._type === "ProductLine"
  );
};

const entryHref = (entry: CargoEntry): string => {
  return `https://consumerrights.wiki/${encodeURIComponent(entry.PageName)}`;
};

const getSuppressScopeLabel = (entry: CargoEntry): string => {
  if (entry._type === "ProductLine") return "product";
  return entry._type.toLowerCase();
};

const linkHoverHandlers = {
  onMouseEnter: (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = POPUP_CSS.link;
    event.currentTarget.style.textDecoration = "underline";
  },
  onMouseLeave: (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = POPUP_CSS.text;
    event.currentTarget.style.textDecoration = "none";
  },
  onFocus: (event: React.FocusEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = POPUP_CSS.link;
    event.currentTarget.style.textDecoration = "underline";
  },
  onBlur: (event: React.FocusEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.color = POPUP_CSS.text;
    event.currentTarget.style.textDecoration = "none";
  },
};

const ghostButtonHoverHandlers = {
  onMouseEnter: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.style.background = "rgba(255,255,255,0.24)";
  },
  onMouseLeave: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.style.background = "transparent";
  },
};

const EntryLink = (props: {
  entry: CargoEntry;
  externalIconUrl: string;
  linkStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  iconSize?: number;
  statusLozenge?: string;
}) => {
  const {
    entry,
    externalIconUrl,
    linkStyle,
    titleStyle,
    iconSize = 12,
    statusLozenge,
  } = props;
  return (
    <a
      href={entryHref(entry)}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      {...linkHoverHandlers}
    >
      <span style={titleStyle}>{entry.PageName}</span>
      {statusLozenge && (
        <span
          style={{
            border: "1px solid rgba(255,255,255,0.45)",
            borderRadius: "999px",
            padding: "1px 6px",
            fontSize: "10px",
            lineHeight: 1.2,
            fontWeight: 700,
            color: POPUP_CSS.text,
            background: "rgba(255,255,255,0.12)",
            flexShrink: 0,
            textTransform: "uppercase",
          }}
        >
          {statusLozenge}
        </span>
      )}
      {shouldShowExternalIcon(entry) && (
        <img
          src={externalIconUrl}
          alt=""
          style={{
            width: `${iconSize}px`,
            height: `${iconSize}px`,
            flexShrink: 0,
            filter: "brightness(0) saturate(100%) invert(100%)",
            opacity: 0.9,
          }}
        />
      )}
    </a>
  );
};

const DescriptionBlock = ({ value }: { value: string }) => {
  return (
    <div
      style={{
        fontSize: "13px",
        color: POPUP_CSS.text,
        marginTop: "2px",
        display: "-webkit-box",
        WebkitLineClamp: 3,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "normal",
      }}
    >
      {value}
    </div>
  );
};

const RelatedGroup = (props: {
  title: string;
  entries: CargoEntry[];
  externalIconUrl: string;
  showIncidentStatus?: boolean;
}) => {
  const { title, entries, externalIconUrl, showIncidentStatus = false } = props;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        style={{
          fontSize: "11px",
          textTransform: "uppercase",
          letterSpacing: ".04em",
          color: POPUP_CSS.muted,
        }}
      >
        {title}
      </div>
      {entries.map((item) => (
        <EntryLink
          key={getEntryKey(item)}
          entry={item}
          externalIconUrl={externalIconUrl}
          linkStyle={{
            fontSize: "12px",
            color: POPUP_CSS.text,
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
          titleStyle={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
          }}
          iconSize={11}
          statusLozenge={
            showIncidentStatus
              ? getIncidentPrimaryStatus(item) || undefined
              : undefined
          }
        />
      ))}
    </div>
  );
};

const TopMatchBlock = (props: {
  entry: CargoEntry;
  companyFallback?: CargoEntry;
  externalIconUrl: string;
}) => {
  const { entry, companyFallback, externalIconUrl } = props;
  const shouldShowCompanyFallback =
    entry._type !== "Company" &&
    companyFallback &&
    companyFallback.PageID !== entry.PageID;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "6px",
        background: POPUP_CSS.subtleBg,
        borderRadius: "10px",
        padding: "10px",
      }}
    >
      <EntryLink
        entry={entry}
        externalIconUrl={externalIconUrl}
        linkStyle={{
          fontSize: "29px",
          fontWeight: 700,
          lineHeight: 1.2,
          color: POPUP_CSS.text,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        titleStyle={{
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          minWidth: 0,
        }}
        iconSize={16}
      />

      {entry._type === "Company" && entry.Industry && (
        <div style={{ fontSize: "13px", color: POPUP_CSS.muted }}>
          {String(entry.Industry)}
        </div>
      )}

      {entry.Description && (
        <DescriptionBlock value={String(entry.Description)} />
      )}

      {shouldShowCompanyFallback && (
        <>
          <div
            style={{
              height: "1px",
              background: POPUP_CSS.divider,
              margin: "2px 0",
            }}
          />
          <EntryLink
            entry={companyFallback}
            externalIconUrl={externalIconUrl}
            linkStyle={{
              fontSize: "16px",
              fontWeight: 700,
              lineHeight: 1.2,
              color: POPUP_CSS.text,
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            titleStyle={{
              display: "-webkit-box",
              WebkitLineClamp: 1,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minWidth: 0,
            }}
            iconSize={13}
          />
          {companyFallback.Description ? (
            <DescriptionBlock value={String(companyFallback.Description)} />
          ) : (
            companyFallback.Industry && (
              <div style={{ fontSize: "13px", color: POPUP_CSS.muted }}>
                {String(companyFallback.Industry)}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
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
  } = props;

  const [logoError, setLogoError] = useState(false);
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
      Math.max(groupedRelated.Incident.length - 5, 0) +
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

  const showHeaderActions = showCloseButton || !!onOpenSettings;
  const visibleIncidents = derived.groupedRelated.Incident.slice(0, 5);
  const expandedIncidents = derived.groupedRelated.Incident.slice(5);
  const hasExpandableRelatedGroups =
    expandedIncidents.length > 0 ||
    derived.groupedRelated.Product.length > 0 ||
    derived.groupedRelated.ProductLine.length > 0;
  const showsRelatedPagesToggle =
    !hideRelatedButtonWhenEmpty || derived.hiddenRelatedPagesCount > 0;
  const hasBodyContentAfterTopMatch =
    derived.groupedRelated.Incident.length > 0 || showsRelatedPagesToggle;
  const secondaryActionButtonStyle: React.CSSProperties = {
    appearance: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    height: "32px",
    margin: 0,
    border: `1px solid ${POPUP_CSS.buttonSecondaryBorder}`,
    background: "transparent",
    color: POPUP_CSS.buttonSecondaryText,
    borderRadius: "10px",
    boxSizing: "border-box",
    padding: "0 14px",
    fontSize: "14px",
    fontWeight: 600,
    lineHeight: 1,
    whiteSpace: "nowrap",
    flexShrink: 0,
    outline: "none",
    cursor: "pointer",
  };
  const resolvedSuppressPageNameLabel =
    suppressPageNameLabel ||
    `Hide for this ${getSuppressScopeLabel(derived.topMatch)}`;

  return (
    <div
      style={{
        background: POPUP_CSS.bg,
        color: POPUP_CSS.text,
        border: `1px solid ${POPUP_CSS.border}`,
        borderRadius: "14px",
        boxShadow: "0 14px 36px rgba(0,0,0,0.35)",
        fontFamily: "ui-sans-serif,system-ui,sans-serif",
        padding: "14px",
        lineHeight: 1.4,
        display: "flex",
        flexDirection: "column",
        ...containerStyle,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: showHeaderActions ? "space-between" : "flex-start",
          gap: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
          }}
        >
          {!logoError && (
            <img
              src={logoUrl}
              alt="CRW"
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                flexShrink: 0,
                objectFit: "cover",
              }}
              onError={() => setLogoError(true)}
            />
          )}
          {logoError && (
            <span
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: POPUP_CSS.panel,
                color: POPUP_CSS.link,
                fontSize: "6px",
                fontWeight: 700,
                letterSpacing: "0.4px",
              }}
            >
              CRW
            </span>
          )}

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                color: POPUP_CSS.text,
                fontSize: "12px",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Consumer Rights Wiki
            </div>
            {domainLabel && (
              <div style={{ fontSize: "10px", color: POPUP_CSS.muted }}>
                {domainLabel}
              </div>
            )}
          </div>
        </div>

        {showHeaderActions && (
          <div
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            {onOpenSettings && settingsIconUrl && (
              <button
                type="button"
                onClick={onOpenSettings}
                {...ghostButtonHoverHandlers}
                aria-label="Open extension settings"
                title="Open settings"
                style={{
                  border: 0,
                  background: "transparent",
                  color: POPUP_CSS.muted,
                  borderRadius: "0",
                  width: "22px",
                  height: "22px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <img
                  src={settingsIconUrl}
                  alt=""
                  aria-hidden="true"
                  style={{
                    width: "18px",
                    height: "18px",
                    display: "block",
                    filter: "brightness(0) saturate(100%) invert(100%)",
                    opacity: 0.82,
                  }}
                />
              </button>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                {...ghostButtonHoverHandlers}
                style={{
                  border: 0,
                  background: "transparent",
                  color: POPUP_CSS.muted,
                  width: "22px",
                  height: "22px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                  fontSize: "24px",
                  lineHeight: 1,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    display: "block",
                    lineHeight: 1,
                    transform: "translateY(-1px)",
                  }}
                >
                  ×
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: hasBodyContentAfterTopMatch ? "10px" : "0",
          background: POPUP_CSS.panel,
          borderRadius: "10px",
          padding: hasBodyContentAfterTopMatch ? "10px 0 6px 0" : "10px 0 0 0",
          overflowY: hasBodyContentAfterTopMatch ? "auto" : "visible",
          minHeight: 0,
          flex: hasBodyContentAfterTopMatch ? 1 : "0 0 auto",
        }}
      >
        <TopMatchBlock
          entry={derived.topMatch}
          companyFallback={derived.companyMatch}
          externalIconUrl={externalIconUrl}
        />

        {derived.groupedRelated.Incident.length > 0 && (
          <div style={{ padding: "0 6px" }}>
            <RelatedGroup
              title="Related Incidents"
              entries={visibleIncidents}
              externalIconUrl={externalIconUrl}
              showIncidentStatus
            />
          </div>
        )}

        {showsRelatedPagesToggle && (
          <div style={{ padding: "0 6px" }}>
            <button
              type="button"
              disabled={derived.hiddenRelatedPagesCount === 0}
              onClick={() => setShowRelatedPages((value) => !value)}
              {...ghostButtonHoverHandlers}
              style={{
                marginTop: "0",
                border: `1px solid ${POPUP_CSS.divider}`,
                background: "transparent",
                color: POPUP_CSS.text,
                borderRadius: "8px",
                padding: "5px 9px",
                fontSize: "12px",
                cursor:
                  derived.hiddenRelatedPagesCount === 0
                    ? "not-allowed"
                    : "pointer",
                opacity: derived.hiddenRelatedPagesCount === 0 ? 0.6 : 1,
              }}
            >
              {showRelatedPages
                ? "Show fewer related pages"
                : `Show ${derived.hiddenRelatedPagesCount} related pages`}
            </button>
          </div>
        )}

        {showRelatedPages && hasExpandableRelatedGroups && (
          <div
            style={{
              padding: "8px 6px 0 6px",
              borderTop: `1px solid ${POPUP_CSS.divider}`,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {expandedIncidents.length > 0 && (
              <RelatedGroup
                title="More Related Incidents"
                entries={expandedIncidents}
                externalIconUrl={externalIconUrl}
                showIncidentStatus
              />
            )}
            {derived.groupedRelated.Product.length > 0 && (
              <RelatedGroup
                title="Related Products"
                entries={derived.groupedRelated.Product}
                externalIconUrl={externalIconUrl}
              />
            )}
            {derived.groupedRelated.ProductLine.length > 0 && (
              <RelatedGroup
                title="Related Product Lines"
                entries={derived.groupedRelated.ProductLine}
                externalIconUrl={externalIconUrl}
              />
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginTop: hasBodyContentAfterTopMatch ? "12px" : "8px",
        }}
      >
        {onSuppressPageName && (
          <button
            type="button"
            onClick={onSuppressPageName}
            {...ghostButtonHoverHandlers}
            style={secondaryActionButtonStyle}
          >
            {resolvedSuppressPageNameLabel}
          </button>
        )}

        <button
          type="button"
          onClick={onSuppressSite}
          {...ghostButtonHoverHandlers}
          style={secondaryActionButtonStyle}
        >
          {suppressButtonLabel}
        </button>
      </div>

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
