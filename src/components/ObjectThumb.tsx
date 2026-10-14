"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import {
  faFile,
  faFileAudio,
  faFileCode,
  faFileImage,
  faFileLines,
  faFilePdf,
  faFileVideo,
  faFileZipper,
  faFolder,
} from "@fortawesome/pro-solid-svg-icons";
import { reqFetchObjectPresign } from "@/services/object.service";
import { cn } from "@/lib/utils";

const EXT_ICONS: Record<string, IconProp> = {
  pdf: faFilePdf,
  zip: faFileZipper,
  gz: faFileZipper,
  tar: faFileZipper,
  mp4: faFileVideo,
  mov: faFileVideo,
  webm: faFileVideo,
  mp3: faFileAudio,
  wav: faFileAudio,
  json: faFileCode,
  js: faFileCode,
  ts: faFileCode,
  html: faFileCode,
  css: faFileCode,
  xml: faFileCode,
  txt: faFileLines,
  md: faFileLines,
  csv: faFileLines,
};

const IMAGE_EXT = ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"];

const extOf = (key: string) => key.split(".").pop()?.toLowerCase() ?? "";

export const isImageKey = (key: string, contentType?: string) =>
  contentType?.startsWith("image/") || IMAGE_EXT.includes(extOf(key));

export const iconForKey = (key: string, contentType?: string): IconProp => {
  if (key.endsWith("/")) return faFolder;
  if (isImageKey(key, contentType)) return faFileImage;
  return EXT_ICONS[extOf(key)] ?? faFile;
};

/**
 * Grid-card preview. Images get a real thumbnail through a presigned URL, but
 * only once the card scrolls into view — a folder of 500 images shouldn't fire
 * 500 presign calls up front. Everything else shows a type icon.
 */
export function ObjectThumb({
  objectKey,
  contentType,
  className,
}: {
  objectKey: string;
  contentType?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const image = isImageKey(objectKey, contentType);

  useEffect(() => {
    if (!image || !ref.current) return;
    let cancelled = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        reqFetchObjectPresign(objectKey, 900).then((res) => {
          if (cancelled) return;
          if (res.success) setSrc(res.data.url);
          else setFailed(true);
        });
      },
      { rootMargin: "200px" },
    );
    io.observe(ref.current);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [objectKey, image]);

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center overflow-hidden bg-surface-alt",
        className,
      )}
    >
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <FontAwesomeIcon
          icon={iconForKey(objectKey, contentType)}
          className="h-9 w-9 text-dimmed"
        />
      )}
    </div>
  );
}
