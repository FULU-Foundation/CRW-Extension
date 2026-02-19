import browser from "webextension-polyfill";

import * as Constants from "@/shared/constants";
import { CargoEntry, PageContext } from "@/shared/types";
import * as Messaging from "@/messaging";
import { MessageType } from "@/messaging/type";

console.log(
  `${Constants.LOG_PREFIX} Content script loaded on:`,
  window.location.href,
);

const normalizeHostname = (hostname: string): string => {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
};

const getSuppressedDomains = async (): Promise<string[]> => {
  const stored = await browser.storage.local.get(Constants.STORAGE.SUPPRESSED_DOMAINS);
  const value = stored[Constants.STORAGE.SUPPRESSED_DOMAINS];
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => normalizeHostname(entry))
    .filter((entry) => entry.length > 0);
};

const isCurrentSiteSuppressed = async (): Promise<boolean> => {
  const domains = await getSuppressedDomains();
  const current = normalizeHostname(location.hostname || "");
  return current.length > 0 && domains.includes(current);
};

const suppressCurrentSite = async (): Promise<void> => {
  const current = normalizeHostname(location.hostname || "");
  if (!current) return;
  const domains = await getSuppressedDomains();
  if (domains.includes(current)) return;
  await browser.storage.local.set({
    [Constants.STORAGE.SUPPRESSED_DOMAINS]: [...domains, current],
  });
};

const runContentScript = async () => {
  if (await isCurrentSiteSuppressed()) {
    removeInlinePopup();
    return;
  }

  const description = (
    document
      .querySelector('meta[name="description"]')
      ?.getAttribute("content") || ""
  ).trim();

  const context: PageContext = {
    url: location.href.toLocaleLowerCase(),
    hostname: location.hostname.toLocaleLowerCase(),
    title: (document.title || "").trim(),
    meta: {
      description,
    },
  };

  browser.runtime.sendMessage(
    Messaging.createMessage(
      MessageType.PAGE_CONTEXT_UPDATE,
      "content",
      context,
    ),
  );
};

const POPUP_ID = "crw-inline-alert";
const POPUP_CSS = {
  bg: "#004080",
  panel: "#004080",
  border: "rgba(255,255,255,0.25)",
  text: "#FFFFFF",
  muted: "rgba(255,255,255,0.82)",
  link: "#36CC",
  buttonText: "#004080",
  buttonBg: "#FFFFFF",
  buttonBgHover: "#3056A9",
  divider: "rgba(255,255,255,0.25)",
  subtleBg: "rgba(255,255,255,0.08)",
  buttonSecondaryText: "#FFFFFF",
  buttonSecondaryBorder: "rgba(255,255,255,0.38)",
};
const removeInlinePopup = () => {
  const existing = document.getElementById(POPUP_ID);
  if (existing) existing.remove();
};

const getEntryKey = (entry: CargoEntry): string => {
  return `${entry._type}:${entry.PageID}`;
};

const shouldShowExternalIcon = (entry: CargoEntry): boolean => {
  return (
    entry._type === "Company" ||
    entry._type === "Incident" ||
    entry._type === "Product" ||
    entry._type === "ProductLine"
  );
};

const createEntryLink = (
  entry: CargoEntry,
  linkStyle: string,
  titleStyle: string,
  iconSize = 12,
) => {
  const link = document.createElement("a");
  link.href = `https://consumerrights.wiki/${encodeURIComponent(entry.PageName)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute("style", linkStyle);

  const title = document.createElement("span");
  title.textContent = entry.PageName;
  title.setAttribute("style", titleStyle);
  link.appendChild(title);

  if (shouldShowExternalIcon(entry)) {
    const externalIcon = document.createElement("img");
    externalIcon.src = browser.runtime.getURL("open-in-new.svg");
    externalIcon.alt = "";
    externalIcon.setAttribute(
      "style",
      `width:${iconSize}px;height:${iconSize}px;flex-shrink:0;filter:brightness(0) saturate(100%) invert(100%);opacity:0.9;`,
    );
    link.appendChild(externalIcon);
  }

  link.addEventListener("mouseenter", () => {
    link.style.color = POPUP_CSS.link;
  });
  link.addEventListener("mouseleave", () => {
    link.style.color = POPUP_CSS.text;
  });
  link.addEventListener("focus", () => {
    link.style.color = POPUP_CSS.link;
  });
  link.addEventListener("blur", () => {
    link.style.color = POPUP_CSS.text;
  });

  return link;
};

const createDescriptionBlock = (value: string) => {
  const description = document.createElement("div");
  description.textContent = value;
  description.setAttribute(
    "style",
    `font-size:13px;color:${POPUP_CSS.text};margin-top:2px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-overflow:ellipsis;white-space:normal;`,
  );
  return description;
};

const createTopMatchBlock = (entry: CargoEntry, companyFallback?: CargoEntry) => {
  const block = document.createElement("div");
  block.setAttribute(
    "style",
    `display:flex;flex-direction:column;gap:6px;background:${POPUP_CSS.subtleBg};border-radius:10px;padding:10px;`,
  );

  const titleLink = createEntryLink(
    entry,
    `font-size:29px;font-weight:700;line-height:1.2;color:${POPUP_CSS.text};text-decoration:none;display:flex;align-items:center;gap:8px;`,
    "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-width:0;",
    16,
  );
  block.appendChild(titleLink);

  if (entry._type === "Company" && entry.Industry) {
    const industry = document.createElement("div");
    industry.textContent = String(entry.Industry);
    industry.setAttribute("style", `font-size:13px;color:${POPUP_CSS.muted};`);
    block.appendChild(industry);
  }

  if (entry.Description) {
    block.appendChild(createDescriptionBlock(String(entry.Description)));
  }

  const shouldShowCompanyFallback =
    entry._type !== "Company" &&
    companyFallback &&
    companyFallback.PageID !== entry.PageID;

  if (shouldShowCompanyFallback) {
    const divider = document.createElement("div");
    divider.setAttribute(
      "style",
      `height:1px;background:${POPUP_CSS.divider};margin:2px 0;`,
    );
    block.appendChild(divider);

    const companyLink = createEntryLink(
      companyFallback,
      `font-size:16px;font-weight:700;line-height:1.2;color:${POPUP_CSS.text};text-decoration:none;display:flex;align-items:center;gap:6px;`,
      "display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;min-width:0;",
      13,
    );
    block.appendChild(companyLink);

    if (companyFallback.Description) {
      block.appendChild(createDescriptionBlock(String(companyFallback.Description)));
    } else if (companyFallback.Industry) {
      const industry = document.createElement("div");
      industry.textContent = String(companyFallback.Industry);
      industry.setAttribute("style", `font-size:13px;color:${POPUP_CSS.muted};`);
      block.appendChild(industry);
    }
  }

  return block;
};

const createRelatedGroup = (title: string, entries: CargoEntry[]) => {
  const group = document.createElement("div");
  group.setAttribute("style", "display:flex;flex-direction:column;gap:6px;");

  const header = document.createElement("div");
  header.textContent = title;
  header.setAttribute(
    "style",
    `font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:${POPUP_CSS.muted};`,
  );
  group.appendChild(header);

  for (const item of entries) {
    const row = createEntryLink(
      item,
      `font-size:12px;color:${POPUP_CSS.text};text-decoration:none;display:flex;align-items:center;gap:4px;`,
      "white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;",
      11,
    );
    group.appendChild(row);
  }

  return group;
};

const renderInlinePopup = async (matches: CargoEntry[]) => {
  removeInlinePopup();
  if (matches.length === 0) return;
  if (await isCurrentSiteSuppressed()) return;

  const topMatch = matches[0];
  const topMatchKey = getEntryKey(topMatch);
  const relatedItems = matches.filter((item) => getEntryKey(item) !== topMatchKey);
  const groupedRelated = {
    Incident: relatedItems.filter((item) => item._type === "Incident"),
    Product: relatedItems.filter((item) => item._type === "Product"),
    ProductLine: relatedItems.filter((item) => item._type === "ProductLine"),
  };
  const relatedIncidents = groupedRelated.Incident;
  const relatedOtherCount = groupedRelated.Product.length + groupedRelated.ProductLine.length;
  const companyMatch = matches.find((item) => item._type === "Company");

  const container = document.createElement("div");
  container.id = POPUP_ID;
  container.setAttribute(
    "style",
    [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "width:494px",
      "max-width:calc(100vw - 32px)",
      "z-index:2147483647",
      `background:${POPUP_CSS.bg}`,
      `color:${POPUP_CSS.text}`,
      `border:1px solid ${POPUP_CSS.border}`,
      "border-radius:14px",
      "box-shadow:0 14px 36px rgba(0,0,0,0.35)",
      "font-family:ui-sans-serif,system-ui,sans-serif",
      "padding:14px",
      "line-height:1.4",
    ].join(";"),
  );

  const header = document.createElement("div");
  header.setAttribute(
    "style",
    "display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px;",
  );

  const headerLeft = document.createElement("div");
  headerLeft.setAttribute("style", "display:flex;align-items:center;gap:10px;min-width:0;");

  const logo = document.createElement("img");
  logo.src = browser.runtime.getURL("crw_logo.png");
  logo.alt = "CRW";
  logo.setAttribute(
    "style",
    "width:44px;height:44px;border-radius:6px;flex-shrink:0;object-fit:cover;",
  );
  logo.addEventListener("error", () => {
    logo.style.display = "none";
    fallbackLogo.style.display = "inline-flex";
  });

  const fallbackLogo = document.createElement("span");
  fallbackLogo.textContent = "CRW";
  fallbackLogo.setAttribute(
    "style",
    `display:none;width:44px;height:44px;border-radius:6px;flex-shrink:0;align-items:center;justify-content:center;background:${POPUP_CSS.panel};color:${POPUP_CSS.link};font-size:9px;font-weight:700;letter-spacing:0.4px;`,
  );

  const headerText = document.createElement("div");
  headerText.setAttribute("style", "min-width:0;");
  const title = document.createElement("div");
  title.textContent = "Consumer Rights Wiki";
  title.setAttribute(
    "style",
    `font-weight:700;color:${POPUP_CSS.text};font-size:24px;line-height:1.1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`,
  );
  headerText.appendChild(title);
  headerLeft.appendChild(logo);
  headerLeft.appendChild(fallbackLogo);
  headerLeft.appendChild(headerText);

  const closeButton = document.createElement("button");
  closeButton.textContent = "×";
  closeButton.setAttribute(
    "style",
    `border:0;background:transparent;color:${POPUP_CSS.muted};font-size:22px;line-height:1;cursor:pointer;padding:0 4px;`,
  );
  closeButton.addEventListener("click", () => removeInlinePopup());
  header.appendChild(headerLeft);
  header.appendChild(closeButton);

  const body = document.createElement("div");
  body.setAttribute(
    "style",
    `display:flex;flex-direction:column;gap:10px;background:${POPUP_CSS.panel};border-radius:10px;padding:10px 0 0 0;`,
  );

  body.appendChild(createTopMatchBlock(topMatch, companyMatch));
  if (relatedIncidents.length > 0) {
    const relatedIncidentsSection = document.createElement("div");
    let showAllRelatedIncidents = false;
    const renderRelatedIncidents = () => {
      const visibleIncidents = showAllRelatedIncidents
        ? relatedIncidents
        : relatedIncidents.slice(0, 5);
      relatedIncidentsSection.replaceChildren(
        createRelatedGroup("Related Incidents", visibleIncidents),
      );

      if (relatedIncidents.length > 5) {
        const toggleRelatedIncidents = document.createElement("button");
        toggleRelatedIncidents.textContent = showAllRelatedIncidents
          ? "Show fewer incidents"
          : `Show more incidents (${relatedIncidents.length - 5})`;
        toggleRelatedIncidents.setAttribute(
          "style",
          `margin-top:6px;border:1px solid ${POPUP_CSS.divider};background:transparent;color:${POPUP_CSS.text};border-radius:8px;padding:5px 9px;font-size:12px;cursor:pointer;`,
        );
        toggleRelatedIncidents.addEventListener("click", () => {
          showAllRelatedIncidents = !showAllRelatedIncidents;
          renderRelatedIncidents();
        });
        relatedIncidentsSection.appendChild(toggleRelatedIncidents);
      }
    };
    renderRelatedIncidents();
    body.appendChild(relatedIncidentsSection);
  }

  const relatedSection = document.createElement("div");
  relatedSection.setAttribute(
    "style",
    `display:none;padding-top:8px;border-top:1px solid ${POPUP_CSS.divider};flex-direction:column;gap:10px;`,
  );
  if (groupedRelated.Product.length > 0) {
    relatedSection.appendChild(createRelatedGroup("Related Products", groupedRelated.Product));
  }
  if (groupedRelated.ProductLine.length > 0) {
    relatedSection.appendChild(
      createRelatedGroup("Related Product Lines", groupedRelated.ProductLine),
    );
  }
  body.appendChild(relatedSection);

  const actions = document.createElement("div");
  actions.setAttribute(
    "style",
    "display:flex;justify-content:flex-end;gap:8px;margin-top:12px;",
  );

  const showRelated = document.createElement("button");
  let relatedExpanded = false;
  showRelated.textContent = `Show ${relatedOtherCount} related page${relatedOtherCount === 1 ? "" : "s"}`;
  showRelated.disabled = relatedOtherCount === 0;
  showRelated.setAttribute(
    "style",
    `display:inline-flex;align-items:center;justify-content:center;min-height:20px;border:1px solid ${POPUP_CSS.buttonBg};background:${POPUP_CSS.buttonBg};color:${POPUP_CSS.buttonText};border-radius:10px;padding:5px 14px;font-size:14px;font-weight:700;line-height:1;cursor:pointer;`,
  );
  if (relatedOtherCount === 0) {
    showRelated.style.opacity = "0.6";
    showRelated.style.cursor = "not-allowed";
  }
  showRelated.addEventListener("click", () => {
    if (relatedOtherCount === 0) return;
    relatedExpanded = !relatedExpanded;
    relatedSection.style.display = relatedExpanded ? "flex" : "none";
    showRelated.textContent = relatedExpanded
      ? "Hide related pages"
      : `Show ${relatedOtherCount} related page${relatedOtherCount === 1 ? "" : "s"}`;
  });

  const suppressSite = document.createElement("button");
  suppressSite.textContent = "Don't show for this site";
  suppressSite.setAttribute(
    "style",
    `display:inline-flex;align-items:center;justify-content:center;min-height:20px;border:1px solid ${POPUP_CSS.buttonSecondaryBorder};background:transparent;color:${POPUP_CSS.buttonSecondaryText};border-radius:10px;padding:5px 14px;font-size:14px;font-weight:600;line-height:1;cursor:pointer;`,
  );
  suppressSite.addEventListener("click", () => {
    void (async () => {
      await suppressCurrentSite();
      removeInlinePopup();
    })();
  });

  actions.appendChild(showRelated);
  actions.appendChild(suppressSite);
  container.appendChild(header);
  container.appendChild(body);
  container.appendChild(actions);

  document.documentElement.appendChild(container);
};

const isMatchUpdateMessage = (
  message: unknown,
): message is { type: MessageType; payload?: unknown } => {
  if (!message || typeof message !== "object") return false;
  const typed = message as { type?: MessageType };
  return typed.type === MessageType.MATCH_RESULTS_UPDATED;
};

browser.runtime.onMessage.addListener((msg: unknown) => {
  if (!isMatchUpdateMessage(msg)) return;
  const matches = (msg.payload as CargoEntry[]) || [];
  void renderInlinePopup(matches);
});

void runContentScript();
