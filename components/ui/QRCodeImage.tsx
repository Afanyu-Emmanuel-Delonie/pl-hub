"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodeImage({ path, size = 160 }: { path: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}${path}`;
    QRCode.toDataURL(url, { width: size * 2, margin: 1 }).then((data) => {
      if (!cancelled) setDataUrl(data);
    });
    return () => {
      cancelled = true;
    };
  }, [path, size]);

  return (
    <div
      className="flex items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={{ width: size, height: size }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="QR code" width={size} height={size} />
      ) : (
        <span className="text-xs text-slate-300">Generating…</span>
      )}
    </div>
  );
}
