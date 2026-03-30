import { createPortal } from "react-dom";

import { useRecording } from "../recording/useRecording";

import "./RecordingOverlay.scss";

export const RecordingProgress = () => {
  const { state, stopRecording, formatDuration } = useRecording();

  if (state.status === "idle") {
    return null;
  }

  if (state.status === "recording") {
    const { selection } = state;
    return createPortal(
      <>
        {/* Recording border indicator */}
        {selection && (
          <div
            className="recording-border"
            style={{
              left: selection.x,
              top: selection.y,
              width: selection.width,
              height: selection.height,
            }}
          >
            <div className="recording-border__corner recording-border__corner--tl" />
            <div className="recording-border__corner recording-border__corner--tr" />
            <div className="recording-border__corner recording-border__corner--bl" />
            <div className="recording-border__corner recording-border__corner--br" />
          </div>
        )}
        {/* Progress bar */}
        <div className="recording-progress">
          <div className="recording-progress__indicator">
            <span className="recording-progress__dot" />
            REC
          </div>
          <span className="recording-progress__duration">
            {formatDuration(state.duration)}
          </span>
          <button
            className="recording-progress__stop"
            onClick={stopRecording}
            title="Stop recording"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
          </button>
        </div>
      </>,
      document.body,
    );
  }

  if (state.status === "converting") {
    return createPortal(
      <div className="recording-progress">
        <span className="recording-progress__label">Converting to MP4...</span>
        <div className="recording-progress__bar">
          <div
            className="recording-progress__bar-fill"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <span className="recording-progress__percent">{state.progress}%</span>
      </div>,
      document.body,
    );
  }

  return null;
};
