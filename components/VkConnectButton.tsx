"use client";

import { useState } from "react";

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

export function VkConnectButton({ connected, username }: { connected: boolean; username?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const settingsRes = await fetch("/api/admin/settings");
      const settingsData = await settingsRes.json();
      const vkAppId = settingsData?.social?.vkAppId;

      if (!vkAppId) {
        alert("VK не настроен. Обратитесь к администратору.");
        setLoading(false);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js";
      script.onload = () => initVKID(vkAppId);
      script.onerror = () => {
        alert("Не удалось загрузить VK SDK");
        setLoading(false);
      };
      document.head.appendChild(script);
    } catch {
      setLoading(false);
    }
  }

  function initVKID(appId: string) {
    const VKID = window.VKIDSDK;
    if (!VKID) {
      setLoading(false);
      return;
    }

    VKID.Config.init({
      app: appId,
      redirectUrl: "https://clip-forge.ru/api/social/vk/callback",
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: "wall,video",
    });

    const container = document.getElementById("vkid-container");
    if (!container) {
      setLoading(false);
      return;
    }
    container.innerHTML = "";

    const oneTap = new VKID.OneTap();
    oneTap
      .render({
        container,
        showAlternativeLogin: true,
      })
      .on(VKID.WidgetEvents.ERROR, () => setLoading(false))
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
        try {
          const data = await VKID.Auth.exchangeCode(payload.code, payload.device_id);
          await fetch("/api/social/vk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: data.access_token,
              userId: data.user_id,
              firstName: data.first_name,
              lastName: data.last_name,
              photo: data.photo,
            }),
          });
          window.location.reload();
        } catch {
          setLoading(false);
        }
      });
  }

  if (connected) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">{username || "VK"}</span>
        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">Подключено</span>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={handleConnect}
        disabled={loading}
        className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
      >
        {loading ? "Загрузка..." : "Подключить"}
      </button>
      <div id="vkid-container" className="mt-2" />
    </div>
  );
}
