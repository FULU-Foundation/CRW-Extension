import { useEffect, useRef, useState } from "react";

import type { AutoDismissCursorOutBehavior } from "@/shared/constants";
import { POPUP_CSS } from "@/shared/ui/matchPopupStyles";

type PopupDismissBarProps = {
  timeoutMs: number;
  showProgressBar: boolean;
  cursorOutBehavior: AutoDismissCursorOutBehavior;
  hovering: boolean;
  onDismiss: () => void;
};

export const PopupDismissBar = ({
  timeoutMs,
  showProgressBar,
  cursorOutBehavior,
  hovering,
  onDismiss,
}: PopupDismissBarProps) => {
  const [elapsed, setElapsed] = useState(0);

  // Keep latest prop values accessible inside rAF callbacks without
  // re-creating the animation loop on every render.
  const timeoutMsRef = useRef(timeoutMs);
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    timeoutMsRef.current = timeoutMs;
  }, [timeoutMs]);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const rafRef = useRef<number | null>(null);
  const elapsedRef = useRef(0); // authoritative elapsed, kept in sync with state

  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const startRunning = (fromElapsed: number) => {
    cancelRaf();
    elapsedRef.current = fromElapsed;
    const startTime = performance.now();

    const tick = () => {
      const next = fromElapsed + (performance.now() - startTime);
      if (next >= timeoutMsRef.current) {
        setElapsed(timeoutMsRef.current);
        elapsedRef.current = timeoutMsRef.current;
        onDismissRef.current();
        return;
      }
      setElapsed(next);
      elapsedRef.current = next;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // Start on mount, clean up on unmount.
  useEffect(() => {
    startRunning(0);
    return cancelRaf;
  }, []); // intentionally empty — runs once on mount

  // Respond to hover changes.
  useEffect(() => {
    if (hovering) {
      cancelRaf();
    } else {
      const resumeFrom = cursorOutBehavior === "reset" ? 0 : elapsedRef.current;
      startRunning(resumeFrom);
    }
  }, [hovering]); // intentionally omits stable refs and `cursorOutBehavior` — see note below
  // Note: `cursorOutBehavior` and `startRunning` are intentionally omitted.
  // `cursorOutBehavior` is a settings value that doesn't change mid-session.
  // `startRunning` is a stable local function defined in the same scope.

  if (!showProgressBar) return null;

  const remaining = 1 - Math.min(elapsed / timeoutMs, 1);

  return (
    <div
      role="progressbar"
      aria-label="Time until popup closes"
      aria-valuenow={Math.round(remaining * timeoutMs)}
      aria-valuemin={0}
      aria-valuemax={timeoutMs}
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "3px",
        borderRadius: "0 0 14px 14px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.12)",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${remaining * 100}%`,
          background: POPUP_CSS.text,
          opacity: 0.5,
        }}
      />
    </div>
  );
};
