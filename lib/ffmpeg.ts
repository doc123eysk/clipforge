import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

export interface VideoMeta {
  durationSec: number;
  width: number;
  height: number;
}

export async function probeVideo(filePath: string): Promise<VideoMeta> {
  const { stdout } = await execFileAsync(FFPROBE, [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    filePath,
  ]);

  const info = JSON.parse(stdout);
  const videoStream = info.streams.find((s: { codec_type: string }) => s.codec_type === "video");

  return {
    durationSec: parseFloat(info.format.duration),
    width: videoStream?.width || 0,
    height: videoStream?.height || 0,
  };
}

export async function clipVideo(
  inputPath: string,
  outputPath: string,
  startSec: number,
  endSec: number,
  watermarked: boolean = false
): Promise<void> {
  const duration = endSec - startSec - 1;
  const args = [
    "-y",
    "-ss", String(startSec),
    "-i", inputPath,
    "-t", String(duration),
    "-c:v", "libx264",
    "-c:a", "aac",
    "-movflags", "+faststart",
  ];

  if (watermarked) {
    args.push(
      "-vf",
      "drawtext=text='ClipForge':fontsize=24:fontcolor=white@0.5:x=w-tw-10:y=10"
    );
  }

  args.push(outputPath);

  await execFileAsync(FFMPEG, args);
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  timeSec: number
): Promise<void> {
  await execFileAsync(FFMPEG, [
    "-y",
    "-ss", String(timeSec),
    "-i", inputPath,
    "-vframes", "1",
    "-q:v", "2",
    outputPath,
  ]);
}
