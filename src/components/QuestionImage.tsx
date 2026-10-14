"use client";

import { useState } from "react";
import { topicConfig } from "@/lib/topic.config";
import { isSafeImageUrl } from "@/lib/url-safety";

type QuestionImageProps = {
  publicFields: Record<string, unknown> | undefined;
  className?: string;
};

// Renders the topic's question image (publicFields[NEXT_PUBLIC_FIELD_IMAGE]) when configured.
// Parent keys it by itemId so load/error state resets for every question.
export function QuestionImage({ publicFields, className = "" }: QuestionImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const key = topicConfig.publicFields.image;
  const src = key ? publicFields?.[key] : null;

  if (typeof src !== "string" || !isSafeImageUrl(src) || failed) return null;

  return (
    <div className={["relative overflow-hidden rounded-2xl bg-base-900/40 ring-1 ring-inset ring-base-600/40", className].join(" ")}>
      {!loaded ? <div aria-hidden="true" className="h-40 w-full animate-pulse bg-base-700/50" /> : null}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={[
          "mx-auto h-auto max-h-[200px] w-auto max-w-full object-contain transition-opacity duration-300",
          loaded ? "block opacity-100" : "absolute inset-0 opacity-0",
        ].join(" ")}
      />
    </div>
  );
}
