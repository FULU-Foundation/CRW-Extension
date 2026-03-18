import React from "react";

import {
  type CargoEntry,
  type CompanyEntry,
  type IncidentEntry,
  type ProductEntry,
  type ProductLineEntry,
} from "@/shared/types";
import { RelatedGroup, TopMatchBlock } from "@/shared/ui/MatchPopupPrimitives";
import {
  POPUP_CSS,
  POPUP_LAYOUT,
  ghostButtonHoverHandlers,
} from "@/shared/ui/matchPopupStyles";
import {
  getSeverityLevel,
  SEVERITY_CONFIG,
} from "@/shared/severity";

type MatchPopupBodyProps = {
  topMatch: CargoEntry;
  companyMatch?: CompanyEntry;
  externalIconUrl: string;
  visibleIncidents: IncidentEntry[];
  expandedIncidents: IncidentEntry[];
  relatedProducts: ProductEntry[];
  relatedProductLines: ProductLineEntry[];
  showsRelatedPagesToggle: boolean;
  hiddenRelatedPagesCount: number;
  showRelatedPages: boolean;
  onToggleRelatedPages: () => void;
};

export const MatchPopupBody = (props: MatchPopupBodyProps) => {
  const {
    topMatch,
    companyMatch,
    externalIconUrl,
    visibleIncidents,
    expandedIncidents,
    relatedProducts,
    relatedProductLines,
    showsRelatedPagesToggle,
    hiddenRelatedPagesCount,
    showRelatedPages,
    onToggleRelatedPages,
  } = props;

  const hasExpandableRelatedGroups =
    expandedIncidents.length > 0 ||
    relatedProducts.length > 0 ||
    relatedProductLines.length > 0;
  const hasBodySections =
    visibleIncidents.length > 0 || showsRelatedPagesToggle;
  const shouldUseScrollableBody =
    hasBodySections || (showRelatedPages && hasExpandableRelatedGroups);
  const bodyPanelStyle: React.CSSProperties = {
    ...POPUP_LAYOUT.bodyPanel,
    overflowY: shouldUseScrollableBody ? "auto" : "visible",
    // Allow the panel to shrink under the popup max-height without forcing it
    // to expand and fill unused space.
    flex: shouldUseScrollableBody ? "0 1 auto" : "0 0 auto",
  };

  const totalIncidentCount =
    visibleIncidents.length + expandedIncidents.length;
  const severity = getSeverityLevel(totalIncidentCount);

  return (
    <div style={bodyPanelStyle}>
      <TopMatchBlock
        entry={topMatch}
        companyFallback={companyMatch}
        externalIconUrl={externalIconUrl}
      />

      {severity && (
        <div
          style={{
            ...POPUP_LAYOUT.bodySection,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "3px 8px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: ".03em",
              color: SEVERITY_CONFIG[severity].uiColor,
              background: SEVERITY_CONFIG[severity].uiBg,
              border: `1px solid ${SEVERITY_CONFIG[severity].uiBorder}`,
            }}
          >
            {SEVERITY_CONFIG[severity].label}
          </span>
          <span
            style={{
              fontSize: "11px",
              color: POPUP_CSS.muted,
            }}
          >
            {totalIncidentCount}{" "}
            {totalIncidentCount === 1 ? "incident" : "incidents"}
          </span>
        </div>
      )}

      {visibleIncidents.length > 0 && (
        <div style={POPUP_LAYOUT.bodySection}>
          <RelatedGroup
            title="Related Incidents"
            entries={visibleIncidents}
            externalIconUrl={externalIconUrl}
            showIncidentStatus
          />
        </div>
      )}

      {showsRelatedPagesToggle && (
        <div style={POPUP_LAYOUT.bodySection}>
          <button
            type="button"
            disabled={hiddenRelatedPagesCount === 0}
            onClick={onToggleRelatedPages}
            {...ghostButtonHoverHandlers}
            style={{
              appearance: "none",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              alignSelf: "flex-start",
              boxSizing: "border-box",
              margin: 0,
              border: `1px solid ${POPUP_CSS.divider}`,
              background: "transparent",
              color: POPUP_CSS.text,
              borderRadius: "8px",
              padding: "5px 9px",
              minHeight: "28px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              fontSize: "12px",
              cursor: hiddenRelatedPagesCount === 0 ? "not-allowed" : "pointer",
              opacity: hiddenRelatedPagesCount === 0 ? 0.6 : 1,
            }}
          >
            {showRelatedPages
              ? "Show fewer related pages"
              : `Show ${hiddenRelatedPagesCount} related pages`}
          </button>
        </div>
      )}

      {showRelatedPages && hasExpandableRelatedGroups && (
        <div
          style={{
            ...POPUP_LAYOUT.bodySection,
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
          {relatedProducts.length > 0 && (
            <RelatedGroup
              title="Related Products"
              entries={relatedProducts}
              externalIconUrl={externalIconUrl}
            />
          )}
          {relatedProductLines.length > 0 && (
            <RelatedGroup
              title="Related Product Lines"
              entries={relatedProductLines}
              externalIconUrl={externalIconUrl}
            />
          )}
        </div>
      )}
    </div>
  );
};
