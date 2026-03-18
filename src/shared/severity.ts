export type SeverityLevel = "low" | "moderate" | "high";

export const getIncidentCount = (
  matches: ReadonlyArray<{ _type: string }>,
): number => {
  return matches.filter((entry) => entry._type === "Incident").length;
};

export const getSeverityLevel = (
  incidentCount: number,
): SeverityLevel | null => {
  if (incidentCount <= 0) return null;
  if (incidentCount >= 15) return "high";
  if (incidentCount >= 5) return "moderate";
  return "low";
};

export const SEVERITY_CONFIG = {
  low: {
    label: "Low concern",
    badgeColor: "#FF9800",
    uiColor: "#FFB300",
    uiBg: "rgba(255,179,0,0.18)",
    uiBorder: "rgba(255,179,0,0.5)",
  },
  moderate: {
    label: "Moderate concern",
    badgeColor: "#F57C00",
    uiColor: "#FF9800",
    uiBg: "rgba(255,152,0,0.18)",
    uiBorder: "rgba(255,152,0,0.5)",
  },
  high: {
    label: "High alert",
    badgeColor: "#D32F2F",
    uiColor: "#FF5252",
    uiBg: "rgba(255,82,82,0.18)",
    uiBorder: "rgba(255,82,82,0.5)",
  },
} as const;

export const getBadgeColor = (incidentCount: number): string => {
  const level = getSeverityLevel(incidentCount);
  if (!level) return "#FF5722";
  return SEVERITY_CONFIG[level].badgeColor;
};
