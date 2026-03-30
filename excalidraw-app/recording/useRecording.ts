import { useCallback, useEffect, useRef } from "react";

import { useAtom } from "../app-jotai";

import {
  recordingStateAtom,
  type SelectionRect,
  type AspectRatio,
  type Resolution,
  getAspectRatioValue,
  getResolutionHeight,
} from "./recordingState";
import { convertWebMToMP4 } from "./ffmpegService";

// Type declarations for File System Access API
declare global {
  interface Window {
    showSaveFilePicker: (options?: {
      suggestedName?: string;
      types?: {
        description?: string;
        accept: Record<string, string[]>;
      }[];
    }) => Promise<FileSystemFileHandle>;
  }
}

// Helper function to download blob
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Shared refs across all hook instances
let mediaRecorderInstance: MediaRecorder | null = null;
let chunksInstance: Blob[] = [];
let streamInstance: MediaStream | null = null;
let timerInstance: ReturnType<typeof setInterval> | null = null;
let canvasInstance: HTMLCanvasElement | null = null;
let videoInstance: HTMLVideoElement | null = null;
let animationFrameInstance: number | null = null;
let saveFileHandle: FileSystemFileHandle | null = null;
let isRecordingFlag = false; // Track recording state for drawFrame
let currentSelection: SelectionRect | null = null; // Track current selection
let durationInstance = 0; // Track recording duration

export const useRecording = () => {
  const [state, setState] = useAtom(recordingStateAtom);

  const stopAllStreamsRef = useRef<() => void>(() => {});

  const stopAllStreams = useCallback(() => {
    if (streamInstance) {
      streamInstance.getTracks().forEach((track) => track.stop());
      streamInstance = null;
    }
  }, []);

  // Keep ref updated
  stopAllStreamsRef.current = stopAllStreams;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllStreamsRef.current();
      if (timerInstance) {
        clearInterval(timerInstance);
      }
      if (animationFrameInstance) {
        cancelAnimationFrame(animationFrameInstance);
      }
    };
  }, []);

  const startSelection = useCallback(() => {
    setState((prev) => ({ ...prev, status: "selecting", selection: null }));
  }, [setState]);

  const cancelSelection = useCallback(() => {
    setState((prev) => ({ ...prev, status: "idle", selection: null }));
  }, [setState]);

  const setSelection = useCallback(
    (selection: SelectionRect) => {
      setState((prev) => ({ ...prev, selection }));
    },
    [setState],
  );

  const confirmSelection = useCallback(() => {
    if (state.selection) {
      setState((prev) => ({ ...prev, status: "ready" }));
    }
  }, [state.selection, setState]);

  const setAspectRatio = useCallback(
    (aspectRatio: AspectRatio) => {
      setState((prev) => ({ ...prev, aspectRatio }));
    },
    [setState],
  );

  const setResolution = useCallback(
    (resolution: Resolution) => {
      setState((prev) => ({ ...prev, resolution }));
    },
    [setState],
  );

  const drawFrame = useCallback(() => {
    if (
      !videoInstance ||
      !canvasInstance ||
      !streamInstance ||
      !isRecordingFlag
    ) {
      return;
    }

    const video = videoInstance;
    const canvas = canvasInstance;
    const ctx = canvas.getContext("2d");

    if (!ctx || !currentSelection) {
      return;
    }

    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      animationFrameInstance = requestAnimationFrame(drawFrame);
      return;
    }

    // Calculate scale from video to display
    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;

    // Selection in video coordinates
    const sx = currentSelection.x * scaleX;
    const sy = currentSelection.y * scaleY;
    const sw = currentSelection.width * scaleX;
    const sh = currentSelection.height * scaleY;

    // Draw cropped frame
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    animationFrameInstance = requestAnimationFrame(drawFrame);
  }, []);

  const startRecording = useCallback(async () => {
    if (!state.selection) {
      return;
    }

    // Set module-level variables for drawFrame
    currentSelection = state.selection;

    try {
      // Get display media (screen/window/tab)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
        },
        audio: false,
        preferCurrentTab: true,
      } as MediaStreamConstraints);

      // Get microphone audio
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (audioError) {
        // Audio not available, continue without it
      }

      // Combine streams
      const tracks = [...displayStream.getVideoTracks()];
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks());
      }

      streamInstance = new MediaStream(tracks);

      // Create video element to capture frames
      const video = document.createElement("video");
      video.srcObject = displayStream;
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;

      // Wait for video to be ready with actual dimensions
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => resolve();
        video.play().catch(() => {});
      });

      // Wait a bit more for video to have dimensions
      let attempts = 0;
      while ((!video.videoWidth || !video.videoHeight) && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }

      if (!video.videoWidth || !video.videoHeight) {
        throw new Error("Video failed to load dimensions");
      }

      videoInstance = video;

      // Create canvas for cropping with resolution scaling
      const canvas = document.createElement("canvas");
      const targetHeight = getResolutionHeight(state.resolution);
      const selectionAspect = state.selection.width / state.selection.height;

      // Calculate actual pixel dimensions of the selection in the captured video
      // This accounts for HiDPI screens and video scaling
      const actualPixelWidth = Math.round(
        state.selection.width * (video.videoWidth / window.innerWidth),
      );
      const actualPixelHeight = Math.round(
        state.selection.height * (video.videoHeight / window.innerHeight),
      );

      if (targetHeight > 0) {
        // Scale to target resolution, but don't exceed actual captured pixels
        // Upscaling would cause blur
        const maxAllowedHeight = Math.min(targetHeight, actualPixelHeight);
        const maxAllowedWidth = Math.round(maxAllowedHeight * selectionAspect);

        canvas.height = maxAllowedHeight;
        canvas.width = Math.min(maxAllowedWidth, actualPixelWidth);
      } else {
        // Use original selection size in actual pixels
        canvas.width = actualPixelWidth;
        canvas.height = actualPixelHeight;
      }
      canvasInstance = canvas;

      // Get canvas stream for recording
      const canvasStream = canvas.captureStream(30);

      // Add audio track to canvas stream
      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach((track) => canvasStream.addTrack(track));
      }

      // Set recording flag BEFORE drawing frames
      isRecordingFlag = true;

      // Set recording status in state
      setState((prev) => ({ ...prev, status: "recording", duration: 0 }));

      // Draw initial frame and wait for it
      const ctx = canvas.getContext("2d");
      const scaleX = video.videoWidth / window.innerWidth;
      const scaleY = video.videoHeight / window.innerHeight;
      const sx = currentSelection!.x * scaleX;
      const sy = currentSelection!.y * scaleY;
      const sw = currentSelection!.width * scaleX;
      const sh = currentSelection!.height * scaleY;
      ctx?.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

      // Start drawing frames continuously
      drawFrame();

      // Wait a bit for frames to start
      await new Promise((r) => setTimeout(r, 100));

      // Check supported MIME types (with audio codec for microphone)
      const mimeTypes = audioStream
        ? [
            "video/webm;codecs=vp9,opus",
            "video/webm;codecs=vp8,opus",
            "video/webm;codecs=vp9",
            "video/webm;codecs=vp8",
            "video/webm",
          ]
        : ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"];
      let selectedMimeType = "";
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      if (!selectedMimeType) {
        throw new Error("No supported video MIME type");
      }

      // Calculate video bitrate based on resolution for optimal quality
      const getVideoBitrate = (height: number): number => {
        // Bitrate in bits per second, higher resolution needs higher bitrate
        if (height >= 2160) {
          return 50_000_000;
        } // 4K: 50 Mbps
        if (height >= 1440) {
          return 25_000_000;
        } // 2K: 25 Mbps
        if (height >= 1080) {
          return 12_000_000;
        } // 1080p: 12 Mbps
        if (height >= 720) {
          return 8_000_000;
        } // 720p: 8 Mbps
        return 4_000_000; // 480p and below: 4 Mbps
      };

      const videoBitrate = getVideoBitrate(canvas.height);

      // Create MediaRecorder with high quality settings
      const mediaRecorder = new MediaRecorder(canvasStream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: videoBitrate,
      });

      chunksInstance = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksInstance.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop drawing
        if (animationFrameInstance) {
          cancelAnimationFrame(animationFrameInstance);
        }

        // Stop all streams
        stopAllStreams();

        // Get the recorded duration
        const recordedDuration = durationInstance;

        // Create WebM blob
        const webmBlob = new Blob(chunksInstance, { type: "video/webm" });

        if (webmBlob.size === 0) {
          setState((prev) => ({
            ...prev,
            status: "idle",
            duration: 0,
            progress: 0,
          }));
          return;
        }

        // Convert to MP4
        setState((prev) => ({
          ...prev,
          status: "converting",
          progress: 0,
        }));

        try {
          const mp4Blob = await convertWebMToMP4(
            webmBlob,
            recordedDuration,
            (progress) => {
              setState((prev) => ({ ...prev, progress }));
            },
          );

          // Use the file handle from save dialog
          if (saveFileHandle) {
            try {
              const writable = await saveFileHandle.createWritable();
              await writable.write(mp4Blob);
              await writable.close();
            } catch {
              downloadBlob(mp4Blob, `recording-${Date.now()}.mp4`);
            }
            saveFileHandle = null;
          } else {
            // Fallback for browsers without File System Access API or if dialog was cancelled
            downloadBlob(mp4Blob, `recording-${Date.now()}.mp4`);
          }
        } catch {
          // Fallback: save WebM directly
          if (saveFileHandle) {
            try {
              const writable = await saveFileHandle.createWritable();
              await writable.write(webmBlob);
              await writable.close();
            } catch {
              downloadBlob(webmBlob, `recording-${Date.now()}.webm`);
            }
            saveFileHandle = null;
          } else {
            downloadBlob(webmBlob, `recording-${Date.now()}.webm`);
          }
        }

        // Reset state
        setState((prev) => ({
          ...prev,
          status: "idle",
          duration: 0,
          progress: 0,
        }));
      };

      mediaRecorderInstance = mediaRecorder;
      mediaRecorder.start(100);

      // Reset duration tracking
      durationInstance = 0;

      // Start timer
      timerInstance = setInterval(() => {
        durationInstance += 1;
        setState((prev) => ({ ...prev, duration: durationInstance }));
      }, 1000);
    } catch {
      setState((prev) => ({ ...prev, status: "idle" }));
    }
  }, [state.selection, state.resolution, setState, drawFrame, stopAllStreams]);

  const stopRecording = useCallback(async () => {
    // Stop drawing frames first
    isRecordingFlag = false;

    // First, prompt user to select save location
    if ("showSaveFilePicker" in window) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `recording-${Date.now()}.mp4`,
          types: [
            {
              description: "MP4 Video",
              accept: { "video/mp4": [".mp4"] },
            },
          ],
        });
        saveFileHandle = handle;
      } catch (saveError) {
        // User cancelled or error
        if ((saveError as Error).name === "AbortError") {
          isRecordingFlag = false;
          return;
        }
        saveFileHandle = null;
      }
    }

    // Stop the media recorder
    if (mediaRecorderInstance && mediaRecorderInstance.state !== "inactive") {
      mediaRecorderInstance.stop();
    }

    if (timerInstance) {
      clearInterval(timerInstance);
      timerInstance = null;
    }

    // Stop all streams
    stopAllStreams();
  }, [stopAllStreams]);

  const cancelRecording = useCallback(() => {
    isRecordingFlag = false;
    stopRecording();
    stopAllStreams();
    chunksInstance = [];

    setState((prev) => ({
      ...prev,
      status: "idle",
      duration: 0,
      progress: 0,
    }));
  }, [stopRecording, stopAllStreams, setState]);

  const formatDuration = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  return {
    state,
    startSelection,
    cancelSelection,
    setSelection,
    confirmSelection,
    setAspectRatio,
    setResolution,
    startRecording,
    stopRecording,
    cancelRecording,
    formatDuration,
    getAspectRatioValue,
  };
};
