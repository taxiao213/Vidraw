import clsx from "clsx";

import { useCamera } from "../camera/useCamera";
import { CAMERA_SHAPE_OPTIONS } from "../camera/shapes";
import { useRecording } from "../recording/useRecording";

import "./CameraToolbar.scss";

import type { CameraShape, CameraPresetSize } from "../camera/cameraState";

// Simple icons using SVG
const VideoIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 8-6 4 6 4V8Z" />
    <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
  </svg>
);

const VideoOffIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L22 8v8" />
    <path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2l10 10Z" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const ChevronIcon = ({ direction }: { direction: "left" | "right" }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: direction === "left" ? "rotate(0deg)" : "rotate(180deg)",
    }}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

// Record icon
const RecordIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="8" />
  </svg>
);

// Shape icons
const CircleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const RoundedRectIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="4" width="20" height="16" rx="4" />
  </svg>
);

// Size icons
const SmallIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

const MediumIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" />
  </svg>
);

const LargeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="20" height="20" rx="2" />
  </svg>
);

const SHAPE_ICONS: Record<CameraShape, React.FC> = {
  circle: CircleIcon,
  roundedRect: RoundedRectIcon,
};

const SIZE_OPTIONS: {
  value: Exclude<CameraPresetSize, "custom">;
  label: string;
  Icon: React.FC;
}[] = [
  { value: "small", label: "Small", Icon: SmallIcon },
  { value: "medium", label: "Medium", Icon: MediumIcon },
  { value: "large", label: "Large", Icon: LargeIcon },
];

export const CameraToolbar = () => {
  const { config, toggleCamera, setShape, toggleToolbar, setPresetSize } =
    useCamera();
  const {
    state: recordingState,
    startSelection,
    startRecording,
  } = useRecording();

  const handleRecordClick = () => {
    if (recordingState.status === "idle") {
      startSelection();
    } else if (recordingState.status === "ready") {
      startRecording();
    }
  };

  const isRecording =
    recordingState.status === "recording" ||
    recordingState.status === "converting";

  return (
    <div
      className={clsx("camera-toolbar", {
        "camera-toolbar--collapsed": !config.toolbarExpanded,
      })}
    >
      <button
        className="camera-toolbar__toggle"
        onClick={toggleToolbar}
        title={config.toolbarExpanded ? "Collapse" : "Expand"}
      >
        <ChevronIcon direction={config.toolbarExpanded ? "right" : "left"} />
      </button>

      {config.toolbarExpanded && (
        <>
          <div className="camera-toolbar__divider" />

          {/* Camera section */}
          <button
            className={clsx("camera-toolbar__btn", {
              "camera-toolbar__btn--active": config.enabled,
            })}
            onClick={toggleCamera}
            title={config.enabled ? "Turn off camera" : "Turn on camera"}
          >
            {config.enabled ? <VideoIcon /> : <VideoOffIcon />}
          </button>

          {config.enabled && (
            <>
              <div className="camera-toolbar__divider" />

              <div className="camera-toolbar__section-label">Shape</div>
              <div className="camera-toolbar__shapes">
                {CAMERA_SHAPE_OPTIONS.map((option) => {
                  const Icon = SHAPE_ICONS[option.value];
                  return (
                    <button
                      key={option.value}
                      className={clsx("camera-toolbar__shape-btn", {
                        "camera-toolbar__shape-btn--active":
                          config.shape === option.value,
                      })}
                      onClick={() => setShape(option.value)}
                      title={option.label}
                    >
                      <Icon />
                    </button>
                  );
                })}
              </div>

              <div className="camera-toolbar__divider" />

              <div className="camera-toolbar__section-label">Size</div>
              <div className="camera-toolbar__sizes">
                {SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    className={clsx("camera-toolbar__size-btn", {
                      "camera-toolbar__size-btn--active":
                        config.presetSize === option.value,
                    })}
                    onClick={() => setPresetSize(option.value)}
                    title={option.label}
                  >
                    <option.Icon />
                  </button>
                ))}
              </div>
              {config.presetSize === "custom" && (
                <div className="camera-toolbar__custom-size">
                  {config.customSize}px
                </div>
              )}
            </>
          )}

          <div className="camera-toolbar__divider" />

          {/* Recording section */}
          <div className="camera-toolbar__section-label">Record</div>
          <button
            className={clsx("camera-toolbar__btn camera-toolbar__record-btn", {
              "camera-toolbar__record-btn--recording": isRecording,
              "camera-toolbar__record-btn--ready":
                recordingState.status === "ready",
            })}
            onClick={handleRecordClick}
            disabled={isRecording}
            title={
              recordingState.status === "ready"
                ? "Start recording"
                : "Select area to record"
            }
          >
            <RecordIcon />
          </button>
        </>
      )}
    </div>
  );
};
