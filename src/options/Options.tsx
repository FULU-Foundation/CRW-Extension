import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";

const readWarningsEnabled = async (): Promise<boolean> => {
  const stored = await browser.storage.local.get(
    Constants.STORAGE.WARNINGS_ENABLED,
  );
  const value = stored[Constants.STORAGE.WARNINGS_ENABLED];
  if (typeof value === "boolean") return value;
  return true;
};

export default function Options() {
  const [warningsEnabled, setWarningsEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    void (async () => {
      const enabled = await readWarningsEnabled();
      setWarningsEnabled(enabled);
      setLoading(false);
    })();
  }, []);

  const onToggleWarnings = async (enabled: boolean) => {
    setWarningsEnabled(enabled);
    await browser.storage.local.set({
      [Constants.STORAGE.WARNINGS_ENABLED]: enabled,
    });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/crw_logo.png" alt="CRW Logo" className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-[#1DFDC0]">
              CRW Extension Options
            </h1>
          </div>
        </div>

        <section className="border border-gray-800 p-5">
          <h2 className="mb-1 text-lg font-semibold text-[#1DFDC0]">
            Warnings
          </h2>
          <p className="mb-4 text-sm text-gray-300">
            Control whether warnings are automatically shown on matching sites.
          </p>

          <label className="flex items-center justify-between border border-gray-800 px-3 py-3 text-sm">
            <span className="text-gray-200">Show warnings automatically</span>
            <input
              type="checkbox"
              checked={warningsEnabled}
              disabled={loading}
              onChange={(event) => {
                void onToggleWarnings(event.target.checked);
              }}
              className="h-4 w-4 accent-[#1DFDC0]"
            />
          </label>

          <p className="mt-3 text-xs text-gray-500">
            {warningsEnabled
              ? "Warnings are enabled."
              : "Warnings are disabled. You can still force-show via extension icon click."}
          </p>
        </section>
      </div>
    </div>
  );
}
