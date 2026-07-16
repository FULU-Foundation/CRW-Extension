import test from "node:test";
import assert from "node:assert/strict";

import {
  dedupeAndSortCategoryLabels,
  formatCategoryLabel,
  getIncidentCategoryLabels,
  isIncidentAutoPopupEnabled,
  normalizeCategoryKey,
  shouldCategoriesHideAutoPopup,
} from "../src/shared/incidentCategories.ts";
import type { CargoEntry, IncidentEntry } from "../src/shared/types.ts";

const incident = (pageName: string, type?: string): IncidentEntry => ({
  _type: "Incident",
  PageID: `id-${pageName}`,
  PageName: pageName,
  Description: null,
  Type: type,
});

const company = (pageName: string): CargoEntry => ({
  _type: "Company",
  PageID: `id-${pageName}`,
  PageName: pageName,
  Description: null,
});

test("normalizeCategoryKey ignores case and non-alphanumerics", () => {
  assert.equal(
    normalizeCategoryKey("Digital Restrictions"),
    "digitalrestrictions",
  );
  assert.equal(
    normalizeCategoryKey("digital restrictions"),
    "digitalrestrictions",
  );
  assert.equal(
    normalizeCategoryKey("Anti-competitive Behavior"),
    normalizeCategoryKey("Anticompetitive Behavior"),
  );
  assert.equal(normalizeCategoryKey(""), "");
  assert.equal(normalizeCategoryKey(null), "");
});

test("formatCategoryLabel trims and title-cases words", () => {
  assert.equal(
    formatCategoryLabel("  digital restrictions "),
    "Digital Restrictions",
  );
  assert.equal(formatCategoryLabel("Privacy"), "Privacy");
  assert.equal(formatCategoryLabel("EULA"), "EULA");
});

test("getIncidentCategoryLabels splits comma-separated Type and dedupes", () => {
  const labels = getIncidentCategoryLabels(
    incident("A", "Ownership, digital restrictions, Digital Restrictions"),
  );
  assert.deepEqual(labels, ["Ownership", "Digital Restrictions"]);
});

test("getIncidentCategoryLabels returns empty array without Type", () => {
  assert.deepEqual(getIncidentCategoryLabels(incident("A")), []);
  assert.deepEqual(getIncidentCategoryLabels(incident("A", "")), []);
});

test("dedupeAndSortCategoryLabels formats, dedupes by key, and sorts", () => {
  const labels = dedupeAndSortCategoryLabels([
    "privacy",
    "Privacy",
    "Censorship",
    "  digital restrictions ",
    "",
  ]);
  assert.deepEqual(labels, ["Censorship", "Digital Restrictions", "Privacy"]);
});

test("isIncidentAutoPopupEnabled treats missing Type as enabled", () => {
  const disabled = new Set(["privacy"]);
  assert.equal(isIncidentAutoPopupEnabled(incident("A"), disabled), true);
});

test("isIncidentAutoPopupEnabled disabled only when all categories disabled", () => {
  const disabled = new Set(["privacy"]);
  assert.equal(
    isIncidentAutoPopupEnabled(incident("A", "Privacy"), disabled),
    false,
  );
  assert.equal(
    isIncidentAutoPopupEnabled(incident("A", "Privacy, Censorship"), disabled),
    true,
  );
});

test("shouldCategoriesHideAutoPopup hides only when every incident is disabled", () => {
  const matches = [
    company("X"),
    incident("A", "Privacy"),
    incident("B", "Privacy Concern"),
  ];

  assert.equal(
    shouldCategoriesHideAutoPopup(matches, ["Privacy", "Privacy Concern"]),
    true,
  );
  assert.equal(shouldCategoriesHideAutoPopup(matches, ["Privacy"]), false);
  assert.equal(shouldCategoriesHideAutoPopup(matches, []), false);
});

test("shouldCategoriesHideAutoPopup never hides matches without incidents", () => {
  assert.equal(
    shouldCategoriesHideAutoPopup([company("X")], ["Privacy"]),
    false,
  );
});

test("shouldCategoriesHideAutoPopup keeps incidents without category data visible", () => {
  const matches = [incident("A", "Privacy"), incident("B")];
  assert.equal(shouldCategoriesHideAutoPopup(matches, ["Privacy"]), false);
});

test("category comparison is case- and punctuation-insensitive", () => {
  const matches = [incident("A", "Anti-competitive Behavior")];
  assert.equal(
    shouldCategoriesHideAutoPopup(matches, ["Anticompetitive behavior"]),
    true,
  );
});
