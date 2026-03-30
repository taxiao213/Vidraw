import fixWebmDuration from "fix-webm-duration";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let ffmpeg: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createFFmpeg: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let fetchFile: any = null;

const loadModule = async () => {
  if (!createFFmpeg || !fetchFile) {
    const module = await import("@ffmpeg/ffmpeg");
    createFFmpeg = module.createFFmpeg;
    fetchFile = module.fetchFile;
  }
};

export const loadFFmpeg = async (onProgress?: (progress: number) => void) => {
  await loadModule();

  if (ffmpeg?.isLoaded()) {
    return ffmpeg;
  }

  ffmpeg = createFFmpeg({
    log: true,
    progress: ({ ratio }: { ratio: number }) => {
      onProgress?.(Math.round(ratio * 100));
    },
  });

  await ffmpeg.load();

  return ffmpeg;
};

export const convertWebMToMP4 = async (
  webmBlob: Blob,
  duration: number,
  onProgress?: (progress: number) => void,
): Promise<Blob> => {
  await loadModule();

  // Fix WebM duration metadata
  const fixedBlob = await fixWebmDuration(webmBlob, duration * 1000);

  const ffmpeg = await loadFFmpeg(onProgress);

  // Write input file
  ffmpeg.FS("writeFile", "input.webm", await fetchFile(fixedBlob));

  // Convert to MP4 with audio
  // Use scale filter to ensure dimensions are divisible by 2 (required by H.264)
  await ffmpeg.run(
    "-i",
    "input.webm",
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    "-y",
    "output.mp4",
  );

  // Read output file
  const data = ffmpeg.FS("readFile", "output.mp4");

  // Clean up
  ffmpeg.FS("unlink", "input.webm");
  ffmpeg.FS("unlink", "output.mp4");

  return new Blob([data.buffer], { type: "video/mp4" });
};
