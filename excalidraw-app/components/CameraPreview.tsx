import { useEffect, useRef, useState, useCallback } from "react";

import { useCamera } from "../camera/useCamera";
import { CAMERA_SHAPES } from "../camera/shapes";
import { getPreviewSize } from "../camera/cameraState";

import "./CameraToolbar.scss";

// Size constraints for free scaling
const MIN_SIZE = 80;
const MAX_SIZE = 400;

export const CameraPreview = () => {
  const { config, stream, setPosition, setCustomSize } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ size: 0, x: 0, y: 0 });

  const previewSize = getPreviewSize(config);

  // Apply stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Handle drag start
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't drag if clicking on resize handle
      if (
        (e.target as HTMLElement).classList.contains(
          "camera-preview__resize-handle",
        )
      ) {
        return;
      }
      e.preventDefault();
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - config.position.x,
        y: e.clientY - config.position.y,
      });
    },
    [config.position],
  );

  // Handle resize start
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({
        size: previewSize,
        x: e.clientX,
        y: e.clientY,
      });
    },
    [previewSize],
  );

  // Handle drag/resize move
  useEffect(() => {
    if (!isDragging && !isResizing) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (isResizing) {
        // Calculate new size based on mouse movement
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const delta = Math.max(deltaX, deltaY);
        const newSize = Math.max(
          MIN_SIZE,
          Math.min(MAX_SIZE, resizeStart.size + delta),
        );
        setCustomSize(newSize);
      } else if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Boundary check
        const currentSize = getPreviewSize(config);
        const maxX = window.innerWidth - currentSize;
        const maxY = window.innerHeight - currentSize;

        setPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    isDragging,
    isResizing,
    dragOffset,
    resizeStart,
    setPosition,
    setCustomSize,
    config,
  ]);

  if (!config.enabled || !stream) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="camera-preview"
      style={{
        left: config.position.x,
        top: config.position.y,
        width: previewSize,
        height: previewSize,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
    >
      <div
        className="camera-preview__content"
        style={{
          clipPath: CAMERA_SHAPES[config.shape],
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="camera-preview__video"
        />
      </div>
      <div
        className="camera-preview__resize-handle"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};
