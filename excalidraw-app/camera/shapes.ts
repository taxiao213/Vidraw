import type { CameraShape } from "./cameraState";

export const CAMERA_SHAPES: Record<CameraShape, string> = {
  circle: "circle(50% at 50% 50%)",
  roundedRect: "inset(0 round 12px)",
};

export const CAMERA_SHAPE_OPTIONS: { value: CameraShape; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "roundedRect", label: "Rounded Rectangle" },
];
