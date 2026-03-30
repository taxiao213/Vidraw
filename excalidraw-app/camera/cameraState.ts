import { atom } from "../app-jotai";

export type CameraShape = "circle" | "roundedRect";

export type CameraPresetSize = "small" | "medium" | "large" | "custom";

export interface CameraConfig {
  enabled: boolean;
  shape: CameraShape;
  position: { x: number; y: number };
  toolbarExpanded: boolean;
  presetSize: CameraPresetSize;
  customSize: number; // Custom size in pixels (for "custom" preset)
}

// Preset sizes in pixels
export const PRESET_SIZES: Record<
  Exclude<CameraPresetSize, "custom">,
  number
> = {
  small: 120,
  medium: 160,
  large: 220,
};

export const getPreviewSize = (config: CameraConfig): number => {
  if (config.presetSize === "custom") {
    return config.customSize;
  }
  return PRESET_SIZES[config.presetSize];
};

export const cameraConfigAtom = atom<CameraConfig>({
  enabled: false,
  shape: "circle",
  position: { x: 0, y: 0 },
  toolbarExpanded: true,
  presetSize: "medium",
  customSize: 160,
});

export const cameraStreamAtom = atom<MediaStream | null>(null);
