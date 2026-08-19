"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { formatDuration } from "@/lib/format";

interface Video {
  id: string;
  title: string;
  durationSec: number;
  width: number;
  height: number;
  storageKey: string;
}

interface Clip {
  id: string;
  startSec: number;
  endSec: number;
  status: string;
  progress: number;
  storageKey?: string;
  watermarked: boolean;
}

interface Props {
  video: Video;
  initialClips: Clip[];
  maxClips: number;
}

interface Segment {
  id: string;
  start: number;
  end: number;
}

const SEGMENT_COLORS = [
  { border: "#22d3ee", bg: "rgba(34,211,238,0.15)", bgActive: "rgba(34,211,238,0.25)", handle: "#22d3ee", handleHover: "#67e8f9", text: "#a5f3fc", label: "cyan" },
  { border: "#a78bfa", bg: "rgba(167,139,250,0.15)", bgActive: "rgba(167,139,250,0.25)", handle: "#a78bfa", handleHover: "#c4b5fd", text: "#ddd6fe", label: "violet" },
  { border: "#f472b6", bg: "rgba(244,114,182,0.15)", bgActive: "rgba(244,114,182,0.25)", handle: "#f472b6", handleHover: "#f9a8d4", text: "#fbcfe8", label: "pink" },
  { border: "#34d399", bg: "rgba(52,211,153,0.15)", bgActive: "rgba(52,211,153,0.25)", handle: "#34d399", handleHover: "#6ee7b7", text: "#a7f3d0", label: "emerald" },
  { border: "#fbbf24", bg: "rgba(251,191,36,0.15)", bgActive: "rgba(251,191,36,0.25)", handle: "#fbbf24", handleHover: "#fde68a", text: "#fde68a", label: "amber" },
  { border: "#f87171", bg: "rgba(248,113,113,0.15)", bgActive: "rgba(248,113,113,0.25)", handle: "#f87171", handleHover: "#fca5a5", text: "#fecaca", label: "red" },
  { border: "#60a5fa", bg: "rgba(96,165,250,0.15)", bgActive: "rgba(96,165,250,0.25)", handle: "#60a5fa", handleHover: "#93c5fd", text: "#bfdbfe", label: "blue" },
  { border: "#e879f9", bg: "rgba(232,121,249,0.15)", bgActive: "rgba(232,121,249,0.25)", handle: "#e879f9", handleHover: "#f0abfc", text: "#f5d0fe", label: "fuchsia" },
];

function getSegmentColor(index: number) {
  return SEGMENT_COLORS[index % SEGMENT_COLORS.length];
}

interface DragState {
  segId: string;
  edge: "start" | "end";
}

export function Clipper({ video, initialClips, maxClips }: Props) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const timelineRef = useRef<HTMLDivElement>(null);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [realDuration, setRealDuration] = useState(video.durationSec || 0);
  const [scrubbing, setScrubbing] = useState(false);

  const totalDur = realDuration;

  const totalDurRef = useRef(totalDur);
  totalDurRef.current = totalDur;

  const segmentsRef = useRef(segments);
  segmentsRef.current = segments;

  const draggingRef = useRef<DragState | null>(null);
  const scrubbingRef = useRef(false);

  const timeToPercent = (t: number) => (totalDurRef.current > 0 ? (t / totalDurRef.current) * 100 : 0);
  const percentToTime = (p: number) =>
    totalDurRef.current > 0 ? Math.max(0, Math.min(totalDurRef.current, (p / 100) * totalDurRef.current)) : 0;

  useEffect(() => {
    function seekFromMouse(e: MouseEvent) {
      if (!timelineRef.current || !videoRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const time = percentToTime(pct);
      videoRef.current.currentTime = time;
      setVideoCurrentTime(time);
    }

    function handleMouseMove(e: MouseEvent) {
      const drag = draggingRef.current;
      if (drag) {
        if (!timelineRef.current) return;
        const rect = timelineRef.current.getBoundingClientRect();
        const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const time = percentToTime(pct);
        setSegments((prev) =>
          prev.map((seg) => {
            if (seg.id !== drag.segId) return seg;
            if (drag.edge === "start") return { ...seg, start: Math.min(time, seg.end - 0.5) };
            return { ...seg, end: Math.max(time, seg.start + 0.5) };
          })
        );
        return;
      }
      if (scrubbingRef.current) {
        seekFromMouse(e);
      }
    }

    function handleMouseDown(e: MouseEvent) {
      if (scrubbingRef.current) {
        e.preventDefault();
      }
    }

    function handleMouseUp() {
      draggingRef.current = null;
      scrubbingRef.current = false;
      setScrubbing(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  function addSegment() {
    if (segments.length >= maxClips) {
      toast.error(`Максимум ${maxClips} отрезков`);
      return;
    }
    const mid = videoCurrentTime || totalDur / 2;
    const start = Math.max(0, mid - 15);
    const end = Math.min(totalDur, mid + 15);
    const seg: Segment = { id: crypto.randomUUID(), start, end };
    setSegments((s) => [...s, seg]);
    setActiveSegment(seg.id);
  }

  function removeSegment(id: string) {
    setSegments((s) => s.filter((seg) => seg.id !== id));
    if (activeSegment === id) setActiveSegment(null);
  }

  async function renderClip(seg: Segment) {
    const clipId = crypto.randomUUID();
    setProcessing((p) => new Set(p).add(clipId));

    try {
      const res = await fetch(`/api/videos/${video.id}/clips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startSec: seg.start, endSec: seg.end }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Ошибка сервера");
      }
      const data = await res.json();

      setClips((c) => [
        { ...data.clip, startSec: seg.start, endSec: seg.end, status: "processing", progress: 0, watermarked: false },
        ...c,
      ]);
      toast.success("Отрезок отправлен на обработку!");
      pollClipStatus(data.clip.id);
    } catch (e: any) {
      toast.error(e?.message || "Не удалось создать отрезок");
    } finally {
      setProcessing((p) => {
        const next = new Set(p);
        next.delete(clipId);
        return next;
      });
    }
  }

  function pollClipStatus(clipId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/clips/${clipId}/status`);
        if (!res.ok) return;
        const data = await res.json();
        setClips((c) =>
          c.map((cl) => (cl.id === clipId ? { ...cl, status: data.status, progress: data.progress, storageKey: data.storageKey } : cl))
        );
        if (data.status === "ready" || data.status === "error") clearInterval(interval);
      } catch {
        /* retry */
      }
    }, 1500);
  }

  return (
    <div className="space-y-8">
      <div className="glass rounded-3xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full max-h-[50vh] object-contain"
          controls
          onTimeUpdate={() => setVideoCurrentTime(videoRef.current?.currentTime || 0)}
          onLoadedMetadata={() => {
            if (videoRef.current && realDuration === 0) {
              setRealDuration(videoRef.current.duration);
            }
          }}
        >
          <source src={`/api/videos/${video.id}/stream`} />
        </video>
      </div>

      <div className="glass glass-hover rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-zinc-200">Таймлайн</h3>
          <button
            onClick={addSegment}
            disabled={segments.length >= maxClips || totalDur === 0}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-40"
          >
            + Добавить отрезок ({segments.length}/{maxClips})
          </button>
        </div>

        <div className="mb-1 flex justify-between text-xs text-zinc-600">
          <span>0:00</span>
          <span>{formatDuration(totalDur / 4)}</span>
          <span>{formatDuration(totalDur / 2)}</span>
          <span>{formatDuration((totalDur * 3) / 4)}</span>
          <span>{formatDuration(totalDur)}</span>
        </div>

        <div
          ref={timelineRef}
          className="relative h-16 rounded-xl bg-zinc-800/80 select-none"
          onMouseDown={(e) => {
            if (!timelineRef.current || !videoRef.current) return;
            const rect = timelineRef.current.getBoundingClientRect();
            const pct = ((e.clientX - rect.left) / rect.width) * 100;
            const time = percentToTime(pct);
            videoRef.current.currentTime = time;
          }}
        >
          {/* Playhead line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none"
            style={{ left: `${timeToPercent(videoCurrentTime)}%` }}
          />
          {/* Playhead handle - draggable */}
          <div
            className="absolute top-0 bottom-0 z-30 cursor-ew-resize"
            style={{ left: `${timeToPercent(videoCurrentTime)}%`, marginLeft: -8, width: 16 }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrubbingRef.current = true;
              setScrubbing(true);
            }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-black/50 border-2 border-indigo-400" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-lg shadow-black/50 border-2 border-indigo-400" />
          </div>

          {segments.map((seg, i) => {
            const color = getSegmentColor(i);
            const isActive = activeSegment === seg.id;
            return (
              <div
                key={seg.id}
                className={`absolute top-1 bottom-1 rounded-lg border-2 transition-all duration-150`}
                style={{
                  left: `${timeToPercent(seg.start)}%`,
                  width: `${timeToPercent(seg.end - seg.start)}%`,
                  borderColor: color.border,
                  background: isActive ? color.bgActive : color.bg,
                  boxShadow: isActive ? `0 0 12px ${color.border}40` : "none",
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setActiveSegment(seg.id);
                }}
              >
                {/* Start handle */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-l-lg z-10 transition-colors duration-150"
                  style={{ background: color.handle }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = color.handleHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = color.handle)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    draggingRef.current = { segId: seg.id, edge: "start" };
                  }}
                >
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
                    <div className="w-0.5 h-4 rounded-full bg-black/30" />
                  </div>
                </div>
                {/* End handle */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize rounded-r-lg z-10 transition-colors duration-150"
                  style={{ background: color.handle }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = color.handleHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = color.handle)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    draggingRef.current = { segId: seg.id, edge: "end" };
                  }}
                >
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex items-center">
                    <div className="w-0.5 h-4 rounded-full bg-black/30" />
                  </div>
                </div>
                {/* Label */}
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold pointer-events-none select-none drop-shadow-sm" style={{ color: color.text }}>
                  {formatDuration(seg.start)} — {formatDuration(seg.end)}
                </div>
              </div>
            );
          })}
        </div>

        {segments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {segments.map((seg, i) => {
              const color = getSegmentColor(i);
              const isActive = activeSegment === seg.id;
              return (
                <div
                  key={seg.id}
                  className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all duration-150"
                  style={{
                    borderColor: isActive ? color.border : "rgba(255,255,255,0.08)",
                    background: isActive ? color.bgActive : "rgba(255,255,255,0.03)",
                    boxShadow: isActive ? `0 0 16px ${color.border}30` : "none",
                  }}
                >
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color.handle }} />
                  <span className="font-mono text-zinc-400">
                    #{i + 1} {formatDuration(seg.start)} — {formatDuration(seg.end)}
                  </span>
                  <button
                    onClick={() => renderClip(seg)}
                    disabled={processing.has(seg.id)}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                    style={{ background: color.handle }}
                  >
                    {processing.has(seg.id) ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32"><animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/></circle></svg>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    )}
                  </button>
                  <button
                    onClick={() => removeSegment(seg.id)}
                    className="flex items-center justify-center rounded-lg bg-red-600/80 p-1 text-white transition hover:bg-red-500"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {clips.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-bold text-zinc-200">Готовые отрезки</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {clips.map((clip) => (
              <ClipCard key={clip.id} clip={clip} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ClipCard({ clip }: { clip: Clip }) {
  const statusColors: Record<string, string> = {
    pending: "bg-zinc-700 text-zinc-400",
    processing: "bg-amber-500/20 text-amber-400",
    ready: "bg-green-500/20 text-green-400",
    error: "bg-red-500/20 text-red-400",
  };

  const statusLabels: Record<string, string> = {
    pending: "Ожидает",
    processing: "Обработка...",
    ready: "Готово",
    error: "Ошибка",
  };

  return (
    <div className="glass card-glow rounded-2xl overflow-hidden">
      {clip.status === "ready" && clip.storageKey ? (
        <video className="w-full aspect-[9/16] object-cover bg-zinc-900" controls preload="metadata">
          <source src={`/api/clips/${clip.id}/preview`} />
        </video>
      ) : (
        <div className="flex aspect-[9/16] items-center justify-center bg-zinc-900">
          {clip.status === "processing" ? (
            <div className="text-center">
              <div className="mb-2 mx-auto flex h-10 w-10 items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
                    <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${clip.progress}%` }} />
              </div>
              <p className="mt-2 text-xs text-zinc-500">{Math.round(clip.progress)}%</p>
            </div>
          ) : (
            <div className="mx-auto flex h-10 w-10 items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
          )}
        </div>
      )}

      <div className="p-2">
        <div className="mb-1.5 flex items-center justify-between gap-1">
          <span className="font-mono text-[11px] text-zinc-300 truncate">
            {formatDuration(clip.startSec)} — {formatDuration(clip.endSec)}
          </span>
          <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${statusColors[clip.status]}`}>
            {statusLabels[clip.status]}
          </span>
        </div>

        {clip.status === "ready" && (
          <a
            href={`/api/clips/${clip.id}/preview`}
            download
            className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600/80 py-1.5 text-center text-[11px] font-medium text-white transition hover:bg-indigo-500"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Скачать
          </a>
        )}
      </div>
    </div>
  );
}
