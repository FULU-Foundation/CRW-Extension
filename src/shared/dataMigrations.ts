import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { canonicalizeSiteScopeList } from "@/shared/siteScope";

type DataMigrationId = 1;

type DataMigrationState = {
  completedIds: DataMigrationId[];
};

const migrateSuppressedDomainsToSiteScopes = async (): Promise<void> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.SUPPRESSED_DOMAINS,
  );
  const value = stored[Constants.STORAGE.SUPPRESSED_DOMAINS];
  const domains = Array.isArray(value)
    ? value.filter((entry): entry is string => typeof entry === "string")
    : [];

  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: canonicalizeSiteScopeList(domains),
  });
};

const DATA_MIGRATIONS: Record<DataMigrationId, () => Promise<void>> = {
  1: migrateSuppressedDomainsToSiteScopes,
};

const inFlightMigrations = new Map<DataMigrationId, Promise<void>>();

const isObjectRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const decodeDataMigrationState = (value: unknown): DataMigrationState => {
  if (!isObjectRecord(value) || !Array.isArray(value.completedIds)) {
    return { completedIds: [] };
  }

  const completedIds = value.completedIds.filter(
    (entry): entry is DataMigrationId => entry === 1,
  );

  return {
    completedIds: [...new Set(completedIds)].sort(
      (left, right) => left - right,
    ),
  };
};

const readDataMigrationState = async (): Promise<DataMigrationState> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.DATA_MIGRATION_STATE,
  );
  return decodeDataMigrationState(
    stored[Constants.STORAGE.DATA_MIGRATION_STATE],
  );
};

const writeDataMigrationState = async (
  state: DataMigrationState,
): Promise<void> => {
  await browser.storage.local.set({
    [Constants.STORAGE.DATA_MIGRATION_STATE]: state,
  });
};

const markDataMigrationCompleted = async (
  migrationId: DataMigrationId,
): Promise<void> => {
  const state = await readDataMigrationState();
  if (state.completedIds.includes(migrationId)) return;

  await writeDataMigrationState({
    completedIds: [...state.completedIds, migrationId].sort(
      (left, right) => left - right,
    ),
  });
};

const runDataMigration = async (
  migrationId: DataMigrationId,
): Promise<void> => {
  const state = await readDataMigrationState();
  if (state.completedIds.includes(migrationId)) return;

  await DATA_MIGRATIONS[migrationId]();
  await markDataMigrationCompleted(migrationId);
};

export const ensureDataMigration = async (
  migrationId: DataMigrationId,
): Promise<void> => {
  const existing = inFlightMigrations.get(migrationId);
  if (existing) {
    await existing;
    return;
  }

  const promise = runDataMigration(migrationId).finally(() => {
    inFlightMigrations.delete(migrationId);
  });

  inFlightMigrations.set(migrationId, promise);
  await promise;
};
