import browser from "webextension-polyfill";
import { CargoEntry } from "@/shared/types";
import React, { useEffect, useState } from "react";
import * as Constants from "@/shared/constants";

export default function Popup() {
  const [domain, setDomain] = useState<string>("unknown");
  const [loading, setLoading] = useState<boolean>(true);
  const [articles, setArticles] = useState<CargoEntry[]>([]);

  useEffect(() => {
    (async () => {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tabId = tab.id;
      if (!tabId) return;

      if (tab?.url) {
        const u = new URL(tab.url);
        setDomain(u.hostname);
      }

      const storageKey = Constants.STORAGE.MATCHES(tabId);
      const stored = await browser.storage.local.get(storageKey);
      const results = (stored[storageKey] as CargoEntry[]) || [];

      setArticles(results);
      setLoading(false);
    })();
  }, []);

  const openOptions = () => browser.runtime.openOptionsPage();
  const openWiki = () =>
    browser.tabs.create({ url: "https://consumerrights.wiki" });

  return (
    <div className="w-[640px] space-y-4 border-4 border-[#1DFDC0] bg-[#0B0E14] p-4 font-sans text-white">
      <div className="pb-2 text-center">
        <div className="flex items-center justify-center space-x-2">
          <img src="/fulu.png" alt="CRW Logo" className="h-6 w-6 rounded" />
          <h1 className="text-base font-semibold text-[#1DFDC0]">
            CRW Extension
          </h1>
        </div>
      </div>

      <div className="flex h-10 items-center justify-center">
        <p className="text-base leading-none font-medium">{domain}</p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-white">Articles Found:</span>
          <span className="rounded bg-gray-700 px-2 py-1 text-xs font-semibold text-gray-300">
            {loading ? "…" : articles.length}
          </span>
        </div>

        <div className="bg-[#0B0E14]">
          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center text-sm text-gray-400">
              Searching for related articles…
            </div>
          )}

          {/* No Articles Found */}
          {!loading && articles.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">
              No related articles found.
            </div>
          )}

          {/* Render Articles */}
          {!loading &&
            articles.map((data: CargoEntry, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between border-t border-gray-800 px-3 py-2"
              >
                <div className="flex-1 pr-2">
                  <div className="text-sm font-semibold text-[#1DFDC0]">
                    {data?.PageName}
                  </div>

                  <div className="line-clamp-3 text-xs text-gray-300">
                    {data?.Description || "No description available."}
                  </div>
                </div>

                <button
                  className="ml-2 rounded border border-[#1DFDC0] px-2 py-1 text-xs text-[#1DFDC0] hover:bg-[#1DFDC0] hover:text-[#0B0E14]"
                  onClick={() =>
                    browser.tabs.create({
                      url: `https://consumerrights.wiki/${data?.PageName}`,
                    })
                  }
                >
                  View
                </button>
              </div>
            ))}
        </div>

        <div className="flex flex-col">
          <button
            onClick={openWiki}
            className="flex items-center justify-between px-2 py-4 text-left hover:bg-gray-700"
          >
            <span className="text-white">Open the Wiki</span>
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-white">
              Visit
            </span>
          </button>

          <button
            onClick={openOptions}
            className="flex items-center justify-between px-2 py-4 text-left hover:bg-gray-700"
          >
            <span className="text-white">Extension Options</span>
            <span className="rounded bg-gray-700 px-2 py-0.5 text-xs text-white">
              Open
            </span>
          </button>
        </div>
      </div>

      <div className="pt-3 text-center">
        <button className="w-full rounded bg-gray-700 px-2 py-3 text-sm font-medium text-[#1DFDC0] hover:bg-gray-700">
          Exclude this domain from alerts
        </button>
      </div>
    </div>
  );
}
