import { useCallback, useEffect } from "react";

import { useAtom } from "../app-jotai";

import {
  cameraConfigAtom,
  cameraStreamAtom,
  type CameraShape,
  type CameraPresetSize,
  getPreviewSize,
} from "./cameraState";
import {
  loadCameraConfig,
  saveCameraConfig,
  getBottomRightPosition,
} from "./cameraStorage";

export const useCamera = () => {
  const [config, setConfig] = useAtom(cameraConfigAtom);
  const [stream, setStream] = useAtom(cameraStreamAtom);

  // Load config on mount
  useEffect(() => {
    const savedConfig = loadCameraConfig();
    setConfig(savedConfig);
  }, [setConfig]);

  // Save config on change
  useEffect(() => {
    saveCameraConfig(config);
  }, [config]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      setStream(mediaStream);
      setConfig((prev) => {
        // If position is at default (0,0), calculate bottom-right position
        const position =
          prev.position.x === 0 && prev.position.y === 0
            ? getBottomRightPosition(getPreviewSize(prev))
            : prev.position;
        return { ...prev, enabled: true, position };
      });
    } catch (error) {
      console.error("Failed to start camera:", error);
      throw error;
    }
  }, [setStream, setConfig]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setConfig((prev) => ({ ...prev, enabled: false }));
  }, [stream, setStream, setConfig]);

  const toggleCamera = useCallback(async () => {
    if (config.enabled) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [config.enabled, startCamera, stopCamera]);

  const setShape = useCallback(
    (shape: CameraShape) => {
      setConfig((prev) => ({ ...prev, shape }));
    },
    [setConfig],
  );

  const setPosition = useCallback(
    (position: { x: number; y: number }) => {
      setConfig((prev) => ({ ...prev, position }));
    },
    [setConfig],
  );

  const toggleToolbar = useCallback(() => {
    setConfig((prev) => ({ ...prev, toolbarExpanded: !prev.toolbarExpanded }));
  }, [setConfig]);

  const setPresetSize = useCallback(
    (presetSize: CameraPresetSize) => {
      setConfig((prev) => ({ ...prev, presetSize }));
    },
    [setConfig],
  );

  const setCustomSize = useCallback(
    (customSize: number) => {
      setConfig((prev) => ({ ...prev, presetSize: "custom", customSize }));
    },
    [setConfig],
  );

  return {
    config,
    stream,
    startCamera,
    stopCamera,
    toggleCamera,
    setShape,
    setPosition,
    toggleToolbar,
    setPresetSize,
    setCustomSize,
  };
};
