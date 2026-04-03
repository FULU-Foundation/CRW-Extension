import React, { useEffect, useRef, useState } from "react";

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
  // elapsed ms when the timer was last paused
  const [elapsed, setElapsed] = useState(0);
  // whether the timer has been permanently removed by cursor-out behavior
  const [removed, setRemoved] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const cancelRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Tick: advance elapsed via rAF for smooth animation
  const tick = (snapshotElapsed: number, startTime: number) => {
    rafRef.current = requestAnimationFrame(() => {
      const now = performance.now();
      const next = snapshotElapsed + (now - startTime);
      if (next >= timeoutMs) {
        setElapsed(timeoutMs);
        onDismiss();
        return;
      }
      setElapsed(next);
      tick(snapshotElapsed, startTime);
    });
  };

  // Start the running animation from current elapsed
  const startRunning = (fromElapsed: number) => {
    cancelRaf();
    const startTime = performance.now();
    startTimeRef.current = startTime;
    tick(fromElapsed, startTime);
  };

  // Initial start
  useEffect(() => {
    startRunning(0);
    return cancelRaf;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to hover state changes
  useEffect(() => {
    if (removed) return;

    if (hovering) {
      // Pause: snapshot current elapsed, cancel animation
      cancelRaf();
      setElapsed((prev) => {
        startTimeRef.current = null;
        return prev;
      });
    } else {
      // Cursor left
      if (cursorOutBehavior === "remove") {
        setRemoved(true);
        cancelRaf();
        return;
      }
      if (cursorOutBehavior === "reset") {
        setElapsed(0);
        startRunning(0);
        return;
      }
      // "continue" — resume from where we paused
      setElapsed((prev) => {
        startRunning(prev);
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovering]);

  if (removed || !showProgressBar) return null;

  const progress = Math.min(elapsed / timeoutMs, 1);
  const remaining = 1 - progress;

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
          transition: "none",
        }}
      />
    </div>
  );
};
