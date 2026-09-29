"use client";
/* eslint-disable @next/next/no-img-element -- Private attachments use short-lived authenticated Blob URLs, which must not enter the public image optimizer. */

import { useEffect, useState } from "react";
import { useAppSelector } from "@/src/shell/state/store";
import apiClient from "@/src/shell/api/client";
import { attachmentPath } from "../api/attachmentApi";

interface Props { src?: string; alt?: string; className?: string }
export default function ProtectedImage(props: Props) {
  const path = props.src ? attachmentPath(props.src) : null;
  if (path) return <AuthenticatedImage {...props} path={path} />;
  const safe = props.src && (/^https?:\/\//i.test(props.src) || /^\/(?!\/)/.test(props.src) || /^data:image\/(?:png|jpeg);base64,[a-z0-9+/=]+$/i.test(props.src));
  return safe ? <img src={props.src} alt={props.alt || ""} className={props.className} loading="lazy" /> : <span>이미지를 표시할 수 없습니다.</span>;
}
function AuthenticatedImage({ path, alt, className }: Props & { path: string }) {
  const { user, isLoading } = useAppSelector(state => state.auth);
  const identity = user?.username ?? null;
  const [loaded, setLoaded] = useState<{ path: string; identity: string | null; url?: string; failed?: boolean } | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const controller = new AbortController();
    let blobUrl: string | undefined;
    void apiClient.get<Blob>(path, { responseType: "blob", signal: controller.signal }).then(({ data }) => {
      if (controller.signal.aborted) return;
      blobUrl = URL.createObjectURL(data);
      setLoaded({ path, identity, url: blobUrl });
    }).catch(() => { if (!controller.signal.aborted) setLoaded({ path, identity, failed: true }); });
    return () => { controller.abort(); if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [path, identity, isLoading]);
  const current = !isLoading && loaded?.path === path && loaded.identity === identity ? loaded : null;
  if (!current?.url) return <span role="status" className={className}>{current?.failed ? "이미지를 불러올 수 없습니다." : "이미지를 불러오는 중…"}</span>;
  return <img src={current.url} alt={alt || ""} className={className} />;
}
