"use client";

import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function CallbackForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;

    fetch("/api/auth/set-cookie", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    }).then((r) => {
      if (r.ok) router.replace("/");
      else setError(true);
    }).catch(() => setError(true));
  }, [token, router]);

  if (error) return <div className="py-20 text-center text-zinc-500">Ошибка входа</div>;

  return (
    <div className="flex items-center justify-center py-20">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
          <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}
