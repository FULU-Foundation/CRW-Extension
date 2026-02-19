import React from "react";
import browser from "webextension-polyfill";

export default function Options() {
  const previewBadge = async () => {
    try {
      await browser.action.setBadgeBackgroundColor({ color: "#1DFDC0" });
      await browser.action.setBadgeText({ text: "1" });
    } catch {
      // Ignore unsupported browser.action calls in non-extension contexts.
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white">
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/fulu.png" alt="CRW Logo" className="h-8 w-8" />
            <h1 className="text-xl font-semibold text-[#1DFDC0]">
              CRW Extension Options
            </h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={previewBadge}
              className="border border-white px-3 py-1.5 text-sm hover:bg-white hover:text-[#0B0E14]"
            >
              Preview badge
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                browser.runtime.reload();
              }}
              className="border border-white px-3 py-1.5 text-sm hover:bg-white hover:text-[#0B0E14]"
            >
              Reload Extension
            </button>
          </div>
        </div>

        <section className="border border-gray-800 p-5">
          <h2 className="mb-1 text-lg font-semibold text-[#1DFDC0]">
            Excluded Domains
          </h2>
          <p className="mb-4 text-sm text-gray-300">
            Add domains where alerts should be disabled.
          </p>

          <div className="mb-4 flex gap-2">
            <input
              type="text"
              placeholder="example.com"
              className="flex-1 border border-gray-700 bg-[#0B0E14] px-3 py-2 text-sm placeholder-gray-400 focus:border-[#1DFDC0] focus:outline-none"
              disabled
            />
            <button
              className="border border-white px-4 py-2 text-sm opacity-60"
              disabled
            >
              Add
            </button>
          </div>

          <ul className="space-y-2">
            <li className="flex items-center justify-between border border-gray-800 px-3 py-2 text-sm">
              <span className="truncate text-gray-300">example.com</span>
              <button
                className="border border-white px-2 py-1 text-xs opacity-60"
                disabled
              >
                Remove
              </button>
            </li>
            <li className="flex items-center justify-between border border-gray-800 px-3 py-2 text-sm">
              <span className="truncate text-gray-300">news.example.org</span>
              <button
                className="border border-white px-2 py-1 text-xs opacity-60"
                disabled
              >
                Remove
              </button>
            </li>
          </ul>

          <p className="mt-3 text-xs text-gray-500">UI only</p>
        </section>
      </div>
    </div>
  );
}
