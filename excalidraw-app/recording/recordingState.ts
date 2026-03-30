import { atom } from "../app-jotai";

export type RecordingStatus =
  | "idle"
  | "selecting"
  | "ready"
  | "recording"
  | "converting";

export type AspectRatio = "free" | "9:16" | "3:4" | "1:1" | "16:9" | "4:3";

export type Resolution = "480p" | "720p" | "1080p" | "2k" | "4k" | "original";

export interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecordingState {
  status: RecordingStatus;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  selection: SelectionRect | null;
  duration: number; // in seconds
  progress: number; // 0-100 for conversion progress
}

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "9:16", label: "9:16" },
  { value: "3:4", label: "3:4" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "16:9", label: "16:9" },
];

export const RESOLUTIONS: {
  value: Resolution;
  label: string;
  height: number;
}[] = [
  { value: "original", label: "Original", height: 0 },
  { value: "480p", label: "480p (SD)", height: 480 },
  { value: "720p", label: "720p (HD)", height: 720 },
  { value: "1080p", label: "1080p (Full HD)", height: 1080 },
  { value: "2k", label: "2K (QHD)", height: 1440 },
  { value: "4k", label: "4K (UHD)", height: 2160 },
];

export const getResolutionHeight = (resolution: Resolution): number => {
  switch (resolution) {
    case "480p":
      return 480;
    case "720p":
      return 720;
    case "1080p":
      return 1080;
    case "2k":
      return 1440;
    case "4k":
      return 2160;
    default:
      return 0; // original
  }
};

// Calculate width/height ratio for each aspect ratio
export const getAspectRatioValue = (ratio: AspectRatio): number | null => {
  switch (ratio) {
    case "9:16":
      return 9 / 16;
    case "3:4":
      return 3 / 4;
    case "1:1":
      return 1;
    case "4:3":
      return 4 / 3;
    case "16:9":
      return 16 / 9;
    default:
      return null; // free
  }
};

export const recordingStateAtom = atom<RecordingState>({
  status: "idle",
  aspectRatio: "free",
  resolution: "1080p",
  selection: null,
  duration: 0,
  progress: 0,
});
