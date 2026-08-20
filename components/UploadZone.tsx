"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Props { userKind: string }

export function UploadZone({ userKind }: Props) {
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function upload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name.replace(/\.[^.]+$/, ""));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/videos");
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      setUploading(false);
      setProgress(0);
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        router.push(`/videos/${data.videoId}`);
      } else {
        const data = JSON.parse(xhr.responseText);
        alert(data.error || "Ошибка загрузки");
      }
    };
    xhr.onerror = () => { setUploading(false); alert("Ошибка сети"); };
    setUploading(true);
    xhr.send(fd);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files[0]) upload(e.dataTransfer.files[0]); }}
      onClick={() => input.current?.click()}
      className={`glass card-glow cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition ${drag ? "border-indigo-500 bg-indigo-500/5" : "border-white/10 hover:border-white/20"}`}
    >
      <input ref={input} type="file" accept="video/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) upload(e.target.files[0]); }} />
      {uploading ? (
        <div>
          <div className="mx-auto mb-4 h-2 w-64 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-sm text-zinc-400">{progress}%</p>
        </div>
      ) : (
        <>
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <p className="mb-2 text-lg font-medium text-zinc-200">Перетащите видео сюда</p>
          <p className="text-sm text-zinc-500">или нажмите для выбора файла</p>
        </>
      )}
    </div>
  );
}
