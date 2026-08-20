"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatDuration } from "@/lib/format";

interface Video { id: string; title: string; durationSec: number; width: number; height: number; storageKey: string; }
interface Clip { id: string; startSec: number; endSec: number; status: string; progress: number; storageKey?: string | null; watermarked: boolean; }
interface Segment { id: string; start: number; end: number; color: string; }

const COLORS = ["#818cf8", "#a855f7", "#ec4899", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#06b6d4"];

interface Props { video: Video; initialClips: Clip[]; maxClips: number }

export function Clipper({ video, initialClips, maxClips }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [activeSeg, setActiveSeg] = useState<string | null>(null);
  const [clips, setClips] = useState<Clip[]>(initialClips);
  const [creating, setCreating] = useState(false);
  const [dragging, setDragging] = useState<{ segId: string; side: "start" | "end" } | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewClip, setPreviewClip] = useState<Clip | null>(null);
  const rafRef = useRef<number>(0);

  const dur = video.durationSec;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    let running = true;
    const tick = () => {
      if (!running) return;
      setCurrentTime(v.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, []);

  useEffect(() => {
    if (!previewClip) return;
    const v = previewRef.current;
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPreviewClip(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewClip]);

  const seekFromPointer = useCallback((clientX: number) => {
    if (!seekRef.current || !videoRef.current) return;
    const rect = seekRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    videoRef.current.currentTime = x * dur;
  }, [dur]);

  const onSeekDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setScrubbing(true);
    seekFromPointer(e.clientX);
  }, [seekFromPointer]);

  const onSeekMove = useCallback((e: React.PointerEvent) => {
    if (!scrubbing) return;
    seekFromPointer(e.clientX);
  }, [scrubbing, seekFromPointer]);

  const onSeekUp = useCallback(() => {
    setScrubbing(false);
  }, []);

  const addSegment = () => {
    if (segments.length >= maxClips) return;
    const last = segments[segments.length - 1];
    const start = last ? Math.min(last.end + 1, dur - 1) : 0;
    const end = Math.min(start + 10, dur);
    const seg: Segment = { id: `seg-${Date.now()}`, start, end, color: COLORS[segments.length % COLORS.length] };
    setSegments([...segments, seg]);
    setActiveSeg(seg.id);
  };

  const removeSegment = (id: string) => {
    setSegments(segments.filter((s) => s.id !== id));
    if (activeSeg === id) setActiveSeg(null);
  };

  const updateSeg = (id: string, patch: Partial<Segment>) => {
    setSegments(segments.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const onTimelineMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, segId: string, side: "start" | "end") => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    setActiveSeg(segId);
    setDragging({ segId, side });
  }, []);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const time = x * dur;
      const seg = segments.find((s) => s.id === dragging.segId);
      if (!seg) return;
      if (dragging.side === "start") {
        updateSeg(dragging.segId, { start: Math.min(time, seg.end - 0.5) });
      } else {
        updateSeg(dragging.segId, { end: Math.max(time, seg.start + 0.5) });
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onUp); };
  }, [dragging, segments, dur]);

  const createClips = async () => {
    if (!segments.length || creating) return;
    setCreating(true);
    setError(null);
    const created: Clip[] = [];
    for (const seg of segments) {
      try {
        const res = await fetch(`/api/videos/${video.id}/clips`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startSec: seg.start, endSec: seg.end, watermarked: false }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || `Ошибка ${res.status}`);
          break;
        }
        if (data.clip) created.push(data.clip);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Сетевая ошибка");
        break;
      }
    }
    if (created.length) setClips((prev) => [...created, ...prev]);
    setSegments([]);
    setCreating(false);
  };

  useEffect(() => {
    const pending = clips.filter((c) => c.status === "pending" || c.status === "processing");
    if (!pending.length) return;
    const iv = setInterval(async () => {
      for (const c of pending) {
        try {
          const res = await fetch(`/api/clips/${c.id}/status`);
          const data = await res.json();
          setClips((prev) => prev.map((p) => (p.id === c.id ? { ...p, ...data } : p)));
        } catch {}
      }
    }, 1500);
    return () => clearInterval(iv);
  }, [clips]);

  const playheadPct = dur > 0 ? (currentTime / dur) * 100 : 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <video ref={videoRef} src={`/api/videos/${video.id}/stream`} controls className="mx-auto max-h-[40vh] sm:max-h-[50vh] rounded-xl sm:rounded-2xl w-full" />

      <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="font-semibold text-zinc-200">Таймлайн</h3>
          <div className="flex gap-2 w-full sm:w-auto">
            <button onClick={addSegment} disabled={segments.length >= maxClips} className="flex-1 sm:flex-none rounded-xl bg-indigo-500/20 border border-indigo-500/30 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-indigo-300 transition hover:bg-indigo-500/30 disabled:opacity-50">
              + Сегмент
            </button>
            <button onClick={createClips} disabled={!segments.length || creating} className="flex-1 sm:flex-none rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white transition hover:shadow-lg disabled:opacity-50">
              {creating ? "Создание..." : `Создать (${segments.length})`}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3 rounded-xl bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
            {error}
          </div>
        )}

        <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
          <span>{formatDuration(currentTime)}</span>
          <span>/</span>
          <span>{formatDuration(dur)}</span>
        </div>

        <div
          ref={seekRef}
          className="relative mb-3 h-3 rounded-full bg-white/10 cursor-pointer touch-none select-none"
          onPointerDown={onSeekDown}
          onPointerMove={onSeekMove}
          onPointerUp={onSeekUp}
        >
          <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 pointer-events-none" style={{ width: `${playheadPct}%` }} />
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-4 w-4 rounded-full bg-white shadow-lg shadow-white/30 pointer-events-none"
            style={{ left: `${playheadPct}%` }}
          />
        </div>

        <div ref={timelineRef} className="relative h-10 sm:h-12 rounded-xl bg-white/5 touch-none">
          {segments.map((seg) => (
            <div key={seg.id} className={`absolute top-0 h-full cursor-pointer rounded-lg transition ${activeSeg === seg.id ? "ring-2 ring-white/40" : ""}`}
              style={{ left: `${(seg.start / dur) * 100}%`, width: `${((seg.end - seg.start) / dur) * 100}%`, backgroundColor: seg.color + "33", borderLeft: `3px solid ${seg.color}`, borderRight: `3px solid ${seg.color}` }}
              onClick={(e) => { e.stopPropagation(); setActiveSeg(seg.id); }}>
              <div className="absolute -top-6 left-0 text-[10px] text-zinc-400 hidden sm:block">{formatDuration(seg.start)}</div>
              <div className="absolute h-4 w-2 sm:h-3 sm:w-1.5 cursor-ew-resize rounded-l bg-white/60 left-0 top-1/2 -translate-y-1/2 -ml-0.5" onMouseDown={(e) => onTimelineMouseDown(e, seg.id, "start")} onTouchStart={(e) => onTimelineMouseDown(e, seg.id, "start")} />
              <div className="absolute h-4 w-2 sm:h-3 sm:w-1.5 cursor-ew-resize rounded-r bg-white/60 right-0 top-1/2 -translate-y-1/2 -mr-0.5" onMouseDown={(e) => onTimelineMouseDown(e, seg.id, "end")} onTouchStart={(e) => onTimelineMouseDown(e, seg.id, "end")} />
            </div>
          ))}

          <div className="absolute top-0 h-full w-0.5 bg-white/60 pointer-events-none z-10" style={{ left: `${playheadPct}%` }} />
        </div>

        {segments.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {segments.map((seg) => (
              <div key={seg.id} className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-3 py-1.5 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-zinc-400">{formatDuration(seg.start)} - {formatDuration(seg.end)}</span>
                <button onClick={() => removeSegment(seg.id)} className="ml-1 text-zinc-600 hover:text-red-400">&times;</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {clips.length > 0 && (
        <div className="glass card-glow rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h3 className="mb-4 font-semibold text-zinc-200">Клипы ({clips.length})</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
            {clips.map((clip) => (
              <div key={clip.id} className="glass card-glow rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group" onClick={() => clip.status === "ready" && setPreviewClip(clip)}>
                {clip.status === "ready" ? (
                  <div className="relative aspect-[9/16] overflow-hidden">
                    <video src={`/api/clips/${clip.id}/preview`} className="absolute inset-0 h-full w-full object-cover" muted preload="metadata" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <svg className="opacity-0 group-hover:opacity-100 transition" width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                    </div>
                  </div>
                ) : (
                  <div className="flex aspect-[9/16] items-center justify-center bg-white/5">
                    {clip.status === "error" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset={32 - (clip.progress / 100) * 32}>
                          <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
                        </circle>
                      </svg>
                    )}
                  </div>
                )}
                <div className="p-2">
                  <p className="text-[10px] text-zinc-500">{formatDuration(clip.startSec)} - {formatDuration(clip.endSec)}</p>
                  {clip.status === "ready" && (
                    <a href={`/api/clips/${clip.id}/preview`} download onClick={(e) => e.stopPropagation()} className="mt-1 flex items-center justify-center gap-1 rounded-lg bg-indigo-500/20 py-1 text-[10px] text-indigo-300 transition hover:bg-indigo-500/30">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Скачать
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {previewClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewClip(null)}>
          <div className="relative w-full max-w-[22rem] aspect-[9/16]" onClick={(e) => e.stopPropagation()}>
            <video ref={previewRef} src={`/api/clips/${previewClip.id}/preview`} controls autoPlay className="absolute inset-0 h-full w-full rounded-2xl shadow-2xl object-cover" />
            <div className="absolute -bottom-12 left-0 right-0 flex items-center justify-between text-sm text-zinc-400">
              <span>{formatDuration(previewClip.startSec)} - {formatDuration(previewClip.endSec)}</span>
              <div className="flex gap-2">
                <a href={`/api/clips/${previewClip.id}/preview`} download className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-xs text-indigo-300 transition hover:bg-indigo-500/30">Скачать</a>
                <button onClick={() => setPreviewClip(null)} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-300 transition hover:bg-white/20">Закрыть</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
