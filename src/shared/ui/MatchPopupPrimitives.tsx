import React from "react";

import { CargoEntry } from "@/shared/types";
import { POPUP_CSS } from "@/shared/ui/matchPopupStyles";

export const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

export const getIncidentPrimaryStatus = (entry: CargoEntry): string => {
  if (typeof entry.Status !== "string") return "";
  const [primaryStatus] = entry.Status.split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return primaryStatus || "";
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

export const TopMatchBlock = (props: {
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
