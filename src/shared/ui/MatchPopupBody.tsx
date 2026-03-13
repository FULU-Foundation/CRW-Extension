import React from "react";

import { CargoEntry } from "@/shared/types";
import {
  IncidentSummary,
  RelatedGroup,
  TopMatchBlock,
  getIncidentPrimaryStatus,
} from "@/shared/ui/MatchPopupPrimitives";
import {
  POPUP_CSS,
  POPUP_LAYOUT,
  ghostButtonHoverHandlers,
} from "@/shared/ui/matchPopupStyles";

type MatchPopupBodyProps = {
  topMatch: CargoEntry;
  companyMatch?: CargoEntry;
  externalIconUrl: string;
  visibleIncidents: CargoEntry[];
  expandedIncidents: CargoEntry[];
  allIncidents: CargoEntry[];
  relatedProducts: CargoEntry[];
  relatedProductLines: CargoEntry[];
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
    allIncidents,
    relatedProducts,
    relatedProductLines,
    showsRelatedPagesToggle,
    hiddenRelatedPagesCount,
    showRelatedPages,
    onToggleRelatedPages,
  } = props;

  // Calculate incident statistics
  const totalIncidentCount = allIncidents.length;
  const activeIncidentCount = allIncidents.filter(
    (incident) => getIncidentPrimaryStatus(incident).toLowerCase() === "active",
  ).length;

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

  return (
    <div style={bodyPanelStyle}>
      {/* Incident Summary - Most Prominent Element */}
      <IncidentSummary
        totalIncidents={totalIncidentCount}
        activeIncidents={activeIncidentCount}
      />

      {/* Company/Product Info - Reduced Prominence */}
      <TopMatchBlock
        entry={topMatch}
        companyFallback={companyMatch}
        externalIconUrl={externalIconUrl}
      />

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
