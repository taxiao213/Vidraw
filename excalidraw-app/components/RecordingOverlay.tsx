import { useEffect, useRef, useState, useCallback } from "react";

import { useRecording } from "../recording/useRecording";
import {
  ASPECT_RATIOS,
  RESOLUTIONS,
  type SelectionRect,
  type AspectRatio,
  type Resolution,
} from "../recording/recordingState";

import "./RecordingOverlay.scss";

// Press Escape to cancel
const useEscapeKey = (callback: () => void, enabled: boolean) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        callback();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [callback, enabled]);
};

interface DragState {
  isDragging: boolean;
  isResizing: boolean;
  resizeHandle: string | null;
  startX: number;
  startY: number;
  startRect: SelectionRect;
}

export const RecordingOverlay = () => {
  const {
    state,
    setSelection,
    cancelSelection,
    setAspectRatio,
    setResolution,
    getAspectRatioValue,
    startRecording,
  } = useRecording();

  const overlayRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isResizing: false,
    resizeHandle: null,
    startX: 0,
    startY: 0,
    startRect: { x: 0, y: 0, width: 0, height: 0 },
  });

  // Handle escape key
  useEscapeKey(cancelSelection, state.status === "selecting");

  // Initialize selection on mount
  useEffect(() => {
    if (!state.selection) {
      const initialSelection: SelectionRect = {
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      };
      setSelection(initialSelection);
    }
  }, [state.selection, setSelection]);

  // Apply aspect ratio constraint
  const applyAspectRatio = useCallback(
    (rect: SelectionRect, aspectRatio: AspectRatio): SelectionRect => {
      const ratio = getAspectRatioValue(aspectRatio);
      if (!ratio) {
        return rect;
      }

      // Keep width, adjust height
      const newHeight = rect.width / ratio;
      return { ...rect, height: newHeight };
    },
    [getAspectRatioValue],
  );

  // Handle mouse down for dragging
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle?: string) => {
      e.preventDefault();
      e.stopPropagation();

      if (!state.selection) {
        return;
      }

      setDragState({
        isDragging: !handle,
        isResizing: !!handle,
        resizeHandle: handle || null,
        startX: e.clientX,
        startY: e.clientY,
        startRect: state.selection,
      });
    },
    [state.selection],
  );

  // Handle mouse move
  useEffect(() => {
    if (!dragState.isDragging && !dragState.isResizing) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!state.selection) {
        return;
      }

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      if (dragState.isDragging) {
        // Move selection
        const newX = Math.max(
          0,
          Math.min(
            window.innerWidth - dragState.startRect.width,
            dragState.startRect.x + deltaX,
          ),
        );
        const newY = Math.max(
          0,
          Math.min(
            window.innerHeight - dragState.startRect.height,
            dragState.startRect.y + deltaY,
          ),
        );

        const newRect = {
          ...state.selection,
          x: newX,
          y: newY,
        };
        setSelection(newRect);
      } else if (dragState.isResizing && dragState.resizeHandle) {
        // Resize selection
        let newRect = { ...dragState.startRect };

        switch (dragState.resizeHandle) {
          case "se":
            newRect.width = Math.max(100, dragState.startRect.width + deltaX);
            if (state.aspectRatio !== "free") {
              newRect = applyAspectRatio(newRect, state.aspectRatio);
            } else {
              newRect.height = Math.max(
                100,
                dragState.startRect.height + deltaY,
              );
            }
            break;
          case "sw":
            newRect.x = dragState.startRect.x + deltaX;
            newRect.width = Math.max(100, dragState.startRect.width - deltaX);
            if (state.aspectRatio !== "free") {
              newRect = applyAspectRatio(newRect, state.aspectRatio);
            } else {
              newRect.height = Math.max(
                100,
                dragState.startRect.height + deltaY,
              );
            }
            break;
          case "ne":
            newRect.y = dragState.startRect.y + deltaY;
            newRect.width = Math.max(100, dragState.startRect.width + deltaX);
            if (state.aspectRatio !== "free") {
              newRect = applyAspectRatio(newRect, state.aspectRatio);
            } else {
              newRect.height = Math.max(
                100,
                dragState.startRect.height - deltaY,
              );
            }
            break;
          case "nw":
            newRect.x = dragState.startRect.x + deltaX;
            newRect.y = dragState.startRect.y + deltaY;
            newRect.width = Math.max(100, dragState.startRect.width - deltaX);
            if (state.aspectRatio !== "free") {
              newRect = applyAspectRatio(newRect, state.aspectRatio);
            } else {
              newRect.height = Math.max(
                100,
                dragState.startRect.height - deltaY,
              );
            }
            break;
        }

        // Boundary check
        newRect.x = Math.max(0, newRect.x);
        newRect.y = Math.max(0, newRect.y);
        newRect.width = Math.min(newRect.width, window.innerWidth - newRect.x);
        newRect.height = Math.min(
          newRect.height,
          window.innerHeight - newRect.y,
        );

        setSelection(newRect);
      }
    };

    const handleMouseUp = () => {
      setDragState({
        isDragging: false,
        isResizing: false,
        resizeHandle: null,
        startX: 0,
        startY: 0,
        startRect: { x: 0, y: 0, width: 0, height: 0 },
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    state.selection,
    state.aspectRatio,
    setSelection,
    applyAspectRatio,
  ]);

  // Handle aspect ratio change
  const handleAspectRatioChange = useCallback(
    (ratio: AspectRatio) => {
      setAspectRatio(ratio);
      if (state.selection && ratio !== "free") {
        const newRect = applyAspectRatio(state.selection, ratio);
        setSelection(newRect);
      }
    },
    [setAspectRatio, state.selection, applyAspectRatio, setSelection],
  );

  if (state.status !== "selecting" && state.status !== "ready") {
    return null;
  }

  if (!state.selection) {
    return null;
  }

  const { x, y, width, height } = state.selection;

  return (
    <div className="recording-overlay" ref={overlayRef}>
      {/* Darkened areas with click-outside support */}
      <div className="recording-overlay__mask" onClick={cancelSelection}>
        {/* Top, bottom, left, right mask areas */}
        <div className="recording-overlay__mask-top" style={{ height: y }} />
        <div
          className="recording-overlay__mask-bottom"
          style={{ top: y + height }}
        />
        <div
          className="recording-overlay__mask-left"
          style={{ top: y, height, width: x }}
        />
        <div
          className="recording-overlay__mask-right"
          style={{ top: y, height, left: x + width }}
        />
      </div>

      {/* Selection area */}
      <div
        className="recording-overlay__cutout"
        style={{
          left: x,
          top: y,
          width,
          height,
        }}
        onMouseDown={(e) => handleMouseDown(e)}
      >
        {/* Resize handles */}
        <div
          className="recording-overlay__handle recording-overlay__handle--nw"
          onMouseDown={(e) => handleMouseDown(e, "nw")}
        />
        <div
          className="recording-overlay__handle recording-overlay__handle--ne"
          onMouseDown={(e) => handleMouseDown(e, "ne")}
        />
        <div
          className="recording-overlay__handle recording-overlay__handle--sw"
          onMouseDown={(e) => handleMouseDown(e, "sw")}
        />
        <div
          className="recording-overlay__handle recording-overlay__handle--se"
          onMouseDown={(e) => handleMouseDown(e, "se")}
        />
      </div>

      {/* Control bar */}
      <div
        className="recording-overlay__controls"
        style={{
          left: x,
          top: y + height + 10,
        }}
      >
        <select
          className="recording-overlay__ratio-select"
          value={state.aspectRatio}
          onChange={(e) =>
            handleAspectRatioChange(e.target.value as AspectRatio)
          }
        >
          {ASPECT_RATIOS.map((ratio) => (
            <option key={ratio.value} value={ratio.value}>
              {ratio.label}
            </option>
          ))}
        </select>

        <select
          className="recording-overlay__ratio-select"
          value={state.resolution}
          onChange={(e) => setResolution(e.target.value as Resolution)}
        >
          {RESOLUTIONS.map((res) => (
            <option key={res.value} value={res.value}>
              {res.label}
            </option>
          ))}
        </select>

        <button
          className="recording-overlay__btn recording-overlay__btn--cancel"
          onClick={cancelSelection}
        >
          Cancel
        </button>
        <button
          className="recording-overlay__btn recording-overlay__btn--confirm"
          onClick={startRecording}
        >
          Start Recording
        </button>
      </div>
    </div>
  );
};
