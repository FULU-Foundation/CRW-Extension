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
  onDisableWarnings?: () => void;
  onClose?: () => void;
  domainLabel?: string;
  showCloseButton?: boolean;
  hideRelatedButtonWhenEmpty?: boolean;
  containerStyle?: React.CSSProperties;
  suppressButtonLabel?: string;
  disableWarningsLabel?: string;
};

const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
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

const solidButtonHoverHandlers = {
  onMouseEnter: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.style.background = POPUP_CSS.buttonBgHover;
    event.currentTarget.style.color = POPUP_CSS.text;
    event.currentTarget.style.borderColor = POPUP_CSS.buttonBgHover;
  },
  onMouseLeave: (event: React.MouseEvent<HTMLButtonElement>) => {
    if (event.currentTarget.disabled) return;
    event.currentTarget.style.background = POPUP_CSS.buttonBg;
    event.currentTarget.style.color = POPUP_CSS.buttonText;
    event.currentTarget.style.borderColor = POPUP_CSS.buttonBg;
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
}) => {
  const {
    entry,
    externalIconUrl,
    linkStyle,
    titleStyle,
    iconSize = 12,
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
}) => {
  const { title, entries, externalIconUrl } = props;
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
    onDisableWarnings,
    onClose,
    domainLabel,
    showCloseButton = false,
    hideRelatedButtonWhenEmpty = false,
    containerStyle,
    suppressButtonLabel = "Don't show for this site",
    disableWarningsLabel = "Don't show me this again",
  } = props;

  const [logoError, setLogoError] = useState(false);
  const [showAllIncidents, setShowAllIncidents] = useState(false);
  const [showRelatedPages, setShowRelatedPages] = useState(false);

  const derived = useMemo(() => {
    const topMatch = matches[0];
    const topMatchKey = topMatch ? getEntryKey(topMatch) : "";
    const relatedItems = matches.filter(
      (item) => getEntryKey(item) !== topMatchKey,
    );
    const groupedRelated = {
      Incident: relatedItems.filter((item) => item._type === "Incident"),
      Product: relatedItems.filter((item) => item._type === "Product"),
      ProductLine: relatedItems.filter((item) => item._type === "ProductLine"),
    };
    const relatedOtherCount =
      groupedRelated.Product.length + groupedRelated.ProductLine.length;
    const companyMatch = matches.find((item) => item._type === "Company");
    return { topMatch, groupedRelated, relatedOtherCount, companyMatch };
  }, [matches]);

  if (!derived.topMatch) return null;

  const visibleIncidents = showAllIncidents
    ? derived.groupedRelated.Incident
    : derived.groupedRelated.Incident.slice(0, 5);

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
          justifyContent: showCloseButton ? "space-between" : "flex-start",
          gap: "8px",
          marginBottom: "14px",
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
                width: "44px",
                height: "44px",
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
                width: "44px",
                height: "44px",
                borderRadius: "6px",
                flexShrink: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: POPUP_CSS.panel,
                color: POPUP_CSS.link,
                fontSize: "9px",
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
                fontSize: "24px",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              Consumer Rights Wiki
            </div>
            {domainLabel && (
              <div style={{ fontSize: "12px", color: POPUP_CSS.muted }}>
                {domainLabel}
              </div>
            )}
          </div>
        </div>

        {showCloseButton && (
          <button
            type="button"
            onClick={onClose}
            {...ghostButtonHoverHandlers}
            style={{
              border: 0,
              background: "transparent",
              color: POPUP_CSS.muted,
              width: "32px",
              height: "32px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
              fontSize: "24px",
              lineHeight: "24px",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ×
          </button>
        )}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          background: POPUP_CSS.panel,
          borderRadius: "10px",
          padding: "10px 0 0 0",
          overflowY: "auto",
          minHeight: 0,
          flex: 1,
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
            />
            {derived.groupedRelated.Incident.length > 5 && (
              <button
                type="button"
                {...ghostButtonHoverHandlers}
                style={{
                  marginTop: "6px",
                  border: `1px solid ${POPUP_CSS.divider}`,
                  background: "transparent",
                  color: POPUP_CSS.text,
                  borderRadius: "8px",
                  padding: "5px 9px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
                onClick={() => setShowAllIncidents((value) => !value)}
              >
                {showAllIncidents
                  ? "Show fewer incidents"
                  : `Show more incidents (${derived.groupedRelated.Incident.length - 5})`}
              </button>
            )}
          </div>
        )}

        <div
          style={{
            display: showRelatedPages ? "flex" : "none",
            paddingTop: "8px",
            borderTop: `1px solid ${POPUP_CSS.divider}`,
            flexDirection: "column",
            gap: "10px",
          }}
        >
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
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        {(!hideRelatedButtonWhenEmpty || derived.relatedOtherCount > 0) && (
          <button
            type="button"
            disabled={derived.relatedOtherCount === 0}
            onClick={() => setShowRelatedPages((value) => !value)}
            {...solidButtonHoverHandlers}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "20px",
              border: `1px solid ${POPUP_CSS.buttonBg}`,
              background: POPUP_CSS.buttonBg,
              color: POPUP_CSS.buttonText,
              borderRadius: "10px",
              padding: "5px 14px",
              fontSize: "14px",
              fontWeight: 700,
              lineHeight: 1,
              cursor:
                derived.relatedOtherCount === 0 ? "not-allowed" : "pointer",
              opacity: derived.relatedOtherCount === 0 ? 0.6 : 1,
            }}
          >
            {showRelatedPages
              ? "Hide related pages"
              : `Show ${derived.relatedOtherCount} related page${derived.relatedOtherCount === 1 ? "" : "s"}`}
          </button>
        )}

        <button
          type="button"
          onClick={onSuppressSite}
          {...ghostButtonHoverHandlers}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "20px",
            border: `1px solid ${POPUP_CSS.buttonSecondaryBorder}`,
            background: "transparent",
            color: POPUP_CSS.buttonSecondaryText,
            borderRadius: "10px",
            padding: "5px 14px",
            fontSize: "14px",
            fontWeight: 600,
            lineHeight: 1,
            cursor: "pointer",
          }}
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
