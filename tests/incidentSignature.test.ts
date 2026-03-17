import test from "node:test";
import assert from "node:assert/strict";

import {
  buildIncidentSignature,
  getIncidentPrimaryStatusToken,
} from "../src/shared/incidentSignature.ts";
import { entry } from "./helpers.ts";

test("getIncidentPrimaryStatusToken returns first status token", () => {
  const token = getIncidentPrimaryStatusToken(
    entry({
      _type: "Incident",
      PageID: "incident-a",
      PageName: "Incident A",
      Status: "Active, Monitoring",
    }),
  );

  assert.equal(token, "active");
});

test("buildIncidentSignature is order-insensitive and status-sensitive", () => {
  const aThenB = buildIncidentSignature([
    entry({
      _type: "Incident",
      PageID: "incident-a",
      PageName: "Incident A",
      Status: "Active",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-b",
      PageName: "Incident B",
      Status: "Resolved",
    }),
  ]);

  const bThenA = buildIncidentSignature([
    entry({
      _type: "Incident",
      PageID: "incident-b",
      PageName: "Incident B",
      Status: "Resolved",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-a",
      PageName: "Incident A",
      Status: "Active",
    }),
  ]);

  const statusChanged = buildIncidentSignature([
    entry({
      _type: "Incident",
      PageID: "incident-a",
      PageName: "Incident A",
      Status: "Monitoring",
    }),
    entry({
      _type: "Incident",
      PageID: "incident-b",
      PageName: "Incident B",
      Status: "Resolved",
    }),
  ]);

  assert.equal(aThenB, bThenA);
  assert.notEqual(aThenB, statusChanged);
});
