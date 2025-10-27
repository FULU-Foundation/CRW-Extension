import React, { useEffect, useState } from "react";
import browser from "webextension-polyfill";

export default function Popup() {
  const [domain, setDomain] = useState<string>("unknown");

  useEffect(() => {
    (async () => {
      try {
        const [tab] = await browser.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.url) {
          const u = new URL(tab.url);
          setDomain(u.hostname);
        }
      } catch {}
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
            0
          </span>
        </div>

        <div className="bg-[#0B0E14]">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 pr-2">
              <div className="text-sm font-semibold text-[#1DFDC0]">
                Placeholder Article 1
              </div>
              <div className="text-xs text-gray-300">
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
                commodo ligula eget dolor. Aenean massa. Cum sociis natoque
                penatibus et magnis dis parturient.
              </div>
            </div>
            <button className="ml-2 rounded border border-[#1DFDC0] px-2 py-1 text-xs text-[#1DFDC0] hover:bg-[#1DFDC0] hover:text-[#0B0E14]">
              View
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 pr-2">
              <div className="text-sm font-semibold text-[#1DFDC0]">
                Placeholder Article 2
              </div>
              <div className="text-xs text-gray-300">
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
                commodo ligula eget dolor. Aenean massa. Cum sociis natoque
                penatibus et magnis dis parturient.
              </div>
            </div>
            <button className="ml-2 rounded border border-[#1DFDC0] px-2 py-1 text-xs text-[#1DFDC0] hover:bg-[#1DFDC0] hover:text-[#0B0E14]">
              View
            </button>
          </div>

          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex-1 pr-2">
              <div className="text-sm font-semibold text-[#1DFDC0]">
                Placeholder Article 3
              </div>
              <div className="text-xs text-gray-300">
                Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean
                commodo ligula eget dolor. Aenean massa. Cum sociis natoque
                penatibus et magnis dis parturient.
              </div>
            </div>
            <button className="ml-2 rounded border border-[#1DFDC0] px-2 py-1 text-xs text-[#1DFDC0] hover:bg-[#1DFDC0] hover:text-[#0B0E14]">
              View
            </button>
          </div>
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
