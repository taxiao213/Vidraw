import { STORAGE_KEYS } from "../app_constants";

import { PRESET_SIZES, getPreviewSize } from "./cameraState";

import type { CameraConfig, CameraShape } from "./cameraState";

const MARGIN = 20;

// Calculate bottom-right position based on current window size and preview size
export const getBottomRightPosition = (size: number) => ({
  x: window.innerWidth - size - MARGIN,
  y: window.innerHeight - size - MARGIN,
});

// Check if position is at default (uninitialized)
const isDefaultPosition = (position: { x: number; y: number }) => {
  return position.x === 0 && position.y === 0;
};

export const getDefaultCameraConfig = (): CameraConfig => ({
  enabled: false,
  shape: "circle" as CameraShape,
  position: { x: 0, y: 0 }, // Will be calculated on first use
  toolbarExpanded: true,
  presetSize: "medium",
  customSize: PRESET_SIZES.medium,
});

export const saveCameraConfig = (config: CameraConfig): void => {
  try {
    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_CAMERA,
      JSON.stringify(config),
    );
  } catch (error) {
    console.error("Failed to save camera config:", error);
  }
};

export const loadCameraConfig = (): CameraConfig => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.LOCAL_STORAGE_CAMERA);
    if (data) {
      const parsed = JSON.parse(data);
      // If position was saved as default, recalculate for current window
      if (isDefaultPosition(parsed.position)) {
        const size = getPreviewSize({ ...getDefaultCameraConfig(), ...parsed });
        parsed.position = getBottomRightPosition(size);
      }
      return { ...getDefaultCameraConfig(), ...parsed };
    }
  } catch (error) {
    console.error("Failed to load camera config:", error);
  }
  // Return default with calculated position
  const defaultConfig = getDefaultCameraConfig();
  return {
    ...defaultConfig,
    position: getBottomRightPosition(getPreviewSize(defaultConfig)),
  };
};
