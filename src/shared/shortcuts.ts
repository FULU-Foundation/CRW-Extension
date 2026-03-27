export const SHORTCUT_COMMANDS = [
  {
    name: "hide-inline-popup",
    label: "Hide CRW pop-up",
    description: "Hide the in-page CRW pop-up on the current tab.",
    suggestedBinding: "Alt+Shift+D",
  },
  {
    name: "show-inline-popup",
    label: "Show CRW pop-up",
    description: "Show the in-page CRW pop-up on the current tab.",
    suggestedBinding: "Alt+Shift+P",
  },
  {
    name: "toggle-site-snooze",
    label: "Toggle CRW snooze for this domain",
    description: "Hide alerts on the current domain until incident matches change.",
    suggestedBinding: "Alt+Shift+S",
  },
  {
    name: "toggle-site-ignore",
    label: "Toggle CRW ignore for this domain",
    description: "Turn always-hide on or off for the current domain.",
    suggestedBinding: "Alt+Shift+X",
  },
] as const;

export type ShortcutCommandName = (typeof SHORTCUT_COMMANDS)[number]["name"];

export type ShortcutCommandBinding = (typeof SHORTCUT_COMMANDS)[number] & {
  shortcut: string | null;
};

export const SHORTCUT_SETTINGS_FALLBACK_URL = "chrome://extensions/shortcuts";

export const isShortcutCommandName = (
  value: string,
): value is ShortcutCommandName => {
  return SHORTCUT_COMMANDS.some((command) => command.name === value);
};

export const getDefaultShortcutBindings = (): ShortcutCommandBinding[] => {
  return SHORTCUT_COMMANDS.map((command) => ({
    ...command,
    shortcut: null,
  }));
};
