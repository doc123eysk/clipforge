"use client";

import { useState, useRef } from "react";
import toast from "react-hot-toast";

interface Props {
  userKind: string;
}

export function UploadZone({ userKind }: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Выберите видео-файл");
      return;
    }

    setUploading(true);
    setProgress(0);

    const form = new FormData();
    form.append("file", file);
    form.append("title", file.name.replace(/\.[^.]+$/, ""));

    try {
      const xhr = new XMLHttpRequest();
      const p = new Promise<string>((resolve, reject) => {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
          if (xhr.status === 200) {
            const data = JSON.parse(xhr.responseText);
            if (data.duplicate) {
              toast("Этот ролик уже загружен", { icon: "ℹ️" });
            }
            resolve(data.videoId);
          } else {
            reject(new Error("Ошибка загрузки"));
          }
        };
        xhr.onerror = () => reject(new Error("Ошибка сети"));
      });

      xhr.open("POST", "/api/videos");
      xhr.withCredentials = true;
      xhr.send(form);

      const videoId = await p;
      toast.success("Видео загружено!");
      window.location.href = `/videos/${videoId}`;
    } catch {
      toast.error("Не удалось загрузить видео");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={`upload-zone relative cursor-pointer rounded-3xl p-20 text-center transition-all duration-500 ${
        dragOver ? "dragover" : ""
      } ${uploading ? "pointer-events-none" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploading ? (
        <div className="space-y-6 animate-scale-in">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 animate-float">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-semibold text-zinc-200">Загрузка...</p>
            <p className="mt-1 text-sm text-zinc-500">{progress}%</p>
          </div>
          <div className="mx-auto h-2 w-72 overflow-hidden rounded-full bg-zinc-800/50">
            <div
              className="progress-bar h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 animate-float">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-zinc-200">
              Перетащите видео сюда
            </p>
            <p className="mt-3 text-sm text-zinc-500">
              или <span className="text-indigo-400 underline underline-offset-4 decoration-indigo-400/30">нажмите для выбора</span> • MP4, MOV, AVI до 4 ГБ
            </p>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              До 10 мин (Free)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              До 2 часов (PRO)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
