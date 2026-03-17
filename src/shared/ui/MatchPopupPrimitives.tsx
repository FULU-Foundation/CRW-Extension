import React, { useState } from "react";

import {
  type CargoEntry,
  type CompanyEntry,
  isIncidentEntry,
} from "@/shared/types";
import { POPUP_CSS } from "@/shared/ui/matchPopupStyles";

export const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

export const getIncidentPrimaryStatus = (entry: CargoEntry): string => {
  if (!isIncidentEntry(entry) || !entry.Status) return "";
  const [primaryStatus] = entry.Status
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return primaryStatus || "";
};

export const getIncidentTooltipText = (entry: CargoEntry): string => {
  const description = entry.Description?.trim();
  if (description) return description;
  return "No description available.";
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

export const EntryLink = (props: {
  entry: CargoEntry;
  externalIconUrl: string;
  linkStyle: React.CSSProperties;
  titleStyle: React.CSSProperties;
  iconSize?: number;
  statusLozenge?: string;
  onMouseEnter?: React.MouseEventHandler<HTMLAnchorElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLAnchorElement>;
  onFocus?: React.FocusEventHandler<HTMLAnchorElement>;
  onBlur?: React.FocusEventHandler<HTMLAnchorElement>;
}) => {
  const {
    entry,
    externalIconUrl,
    linkStyle,
    titleStyle,
    iconSize = 12,
    statusLozenge,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
  } = props;
  return (
    <a
      href={entryHref(entry)}
      target="_blank"
      rel="noopener noreferrer"
      style={linkStyle}
      onMouseEnter={(event) => {
        linkHoverHandlers.onMouseEnter(event);
        onMouseEnter?.(event);
      }}
      onMouseLeave={(event) => {
        linkHoverHandlers.onMouseLeave(event);
        onMouseLeave?.(event);
      }}
      onFocus={(event) => {
        linkHoverHandlers.onFocus(event);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        linkHoverHandlers.onBlur(event);
        onBlur?.(event);
      }}
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

export const RelatedGroup = (props: {
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
        <IncidentEntry
          key={getEntryKey(item)}
          item={item}
          externalIconUrl={externalIconUrl}
          showIncidentStatus={showIncidentStatus}
        />
      ))}
    </div>
  );
};

const IncidentEntry = (props: {
  item: CargoEntry;
  externalIconUrl: string;
  showIncidentStatus: boolean;
}) => {
  const { item, externalIconUrl, showIncidentStatus } = props;
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipText = getIncidentTooltipText(item);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        zIndex: showTooltip ? 20 : "auto",
      }}
    >
      {showIncidentStatus && showTooltip && (
        <div
          role="tooltip"
          style={{
            position: "absolute",
            left: 0,
            bottom: "calc(100% + 8px)",
            zIndex: 21,
            maxWidth: "280px",
            padding: "10px 12px",
            borderRadius: "10px",
            background:
              "linear-gradient(180deg, rgba(7,18,41,0.98), rgba(6,15,35,0.94))",
            border: "1px solid rgba(216,241,255,0.22)",
            boxShadow: "0 12px 28px rgba(0,0,0,0.28)",
            color: POPUP_CSS.text,
            fontSize: "12px",
            lineHeight: 1.45,
            pointerEvents: "none",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              bottom: "-7px",
              left: "20px",
              width: "12px",
              height: "12px",
              background: "rgba(6,15,35,0.96)",
              borderRight: "1px solid rgba(216,241,255,0.22)",
              borderBottom: "1px solid rgba(216,241,255,0.22)",
              transform: "rotate(45deg)",
            }}
          />
          {tooltipText}
        </div>
      )}

      <EntryLink
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
        onMouseEnter={
          showIncidentStatus ? () => setShowTooltip(true) : undefined
        }
        onMouseLeave={
          showIncidentStatus ? () => setShowTooltip(false) : undefined
        }
        onFocus={showIncidentStatus ? () => setShowTooltip(true) : undefined}
        onBlur={showIncidentStatus ? () => setShowTooltip(false) : undefined}
      />
    </div>
  );
};

export const TopMatchBlock = (props: {
  entry: CargoEntry;
  companyFallback?: CompanyEntry;
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
          {entry.Industry}
        </div>
      )}

      {entry.Description && (
        <DescriptionBlock value={entry.Description} />
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
            <DescriptionBlock value={companyFallback.Description} />
          ) : (
            companyFallback.Industry && (
              <div style={{ fontSize: "13px", color: POPUP_CSS.muted }}>
                {companyFallback.Industry}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};
