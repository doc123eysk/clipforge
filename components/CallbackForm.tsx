"use client";

import { useEffect, useRef } from "react";
import { setAuthToken } from "@/app/actions/auth";

export function CallbackForm({ token }: { token: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    formRef.current?.requestSubmit();
  }, []);

  return (
    <form ref={formRef} action={setAuthToken} className="flex items-center justify-center py-20">
      <input type="hidden" name="token" value={token} />
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2">
        <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="32">
          <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite" />
        </circle>
      </svg>
    </form>
  );
}
