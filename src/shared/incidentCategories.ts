import {
  type CargoEntry,
  type IncidentEntry,
  isIncidentEntry,
} from "./types.ts";

/**
 * Incident categories come from the comma-separated Cargo `Type` field.
 * The wiki data is inconsistently cased and hyphenated ("Digital
 * restrictions" vs "Digital Restrictions", "Anti-competitive" vs
 * "Anticompetitive"), so categories are compared via a normalized key that
 * ignores case and non-alphanumeric characters, while a title-cased label is
 * used for display.
 */

export const normalizeCategoryKey = (
  value: string | null | undefined,
): string => {
  if (!value) return "";
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const formatCategoryLabel = (value: string): string => {
  return value
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word,
    )
    .join(" ");
};

export const getIncidentCategoryLabels = (entry: IncidentEntry): string[] => {
  const rawType = typeof entry.Type === "string" ? entry.Type : "";
  if (!rawType) return [];

  const labelsByKey = new Map<string, string>();
  for (const part of rawType.split(",")) {
    const label = formatCategoryLabel(part);
    const key = normalizeCategoryKey(label);
    if (!key) continue;
    if (!labelsByKey.has(key)) labelsByKey.set(key, label);
  }
  return [...labelsByKey.values()];
};

export const dedupeAndSortCategoryLabels = (labels: string[]): string[] => {
  const labelsByKey = new Map<string, string>();
  for (const raw of labels) {
    const label = formatCategoryLabel(raw);
    const key = normalizeCategoryKey(label);
    if (!key) continue;
    if (!labelsByKey.has(key)) labelsByKey.set(key, label);
  }
  return [...labelsByKey.values()].sort((left, right) =>
    left.localeCompare(right),
  );
};

/**
 * An incident is filtered out of automatic popups only when it has category
 * data and every one of its categories is disabled. Incidents without a
 * `Type` value always count as enabled so missing wiki data never hides a
 * warning.
 */
export const isIncidentAutoPopupEnabled = (
  entry: IncidentEntry,
  disabledCategoryKeys: ReadonlySet<string>,
): boolean => {
  const labels = getIncidentCategoryLabels(entry);
  if (labels.length === 0) return true;
  return labels.some(
    (label) => !disabledCategoryKeys.has(normalizeCategoryKey(label)),
  );
};

/**
 * The automatic popup is hidden when the matches contain at least one
 * incident and every matched incident is disabled by category preferences.
 * Matches without incidents are unaffected (the existing
 * hide-when-no-incidents preference governs those).
 */
export const shouldCategoriesHideAutoPopup = (
  matches: CargoEntry[],
  disabledCategoryLabels: string[],
): boolean => {
  if (disabledCategoryLabels.length === 0) return false;

  const incidents = matches.filter(isIncidentEntry);
  if (incidents.length === 0) return false;

  const disabledKeys = new Set(
    disabledCategoryLabels
      .map((label) => normalizeCategoryKey(label))
      .filter((key) => key.length > 0),
  );
  if (disabledKeys.size === 0) return false;

  return incidents.every(
    (incident) => !isIncidentAutoPopupEnabled(incident, disabledKeys),
  );
};
