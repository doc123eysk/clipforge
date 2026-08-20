import { execFile } from "child_process";
import { promisify } from "util";

const exec = promisify(execFile);

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";

export interface VideoMeta {
  durationSec: number;
  width: number;
  height: number;
}

export async function probeVideo(filePath: string): Promise<VideoMeta> {
  const { stdout } = await exec(FFPROBE, [
    "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", filePath,
  ]);
  const info = JSON.parse(stdout);
  const stream = info.streams.find((s: any) => s.codec_type === "video");
  return {
    durationSec: parseFloat(info.format.duration),
    width: stream.width,
    height: stream.height,
  };
}

export async function clipVideo(
  input: string,
  output: string,
  startSec: number,
  endSec: number,
  watermarked = false
): Promise<void> {
  const duration = endSec - startSec;
  const args = [
    "-ss", String(startSec),
    "-i", input,
    "-t", String(duration),
    "-c:v", "libx264", "-preset", "fast",
    "-c:a", "aac",
    "-movflags", "+faststart",
  ];
  if (watermarked) {
    args.push("-vf", "drawtext=text='ClipForge':fontsize=24:fontcolor=white@0.3:x=10:y=10");
  }
  args.push(output);
  await exec(FFMPEG, args, { timeout: 300000 });
}
