"use client";

import { useState } from "react";
import { topicConfig } from "@/lib/topic.config";
import { isSafeImageUrl } from "@/lib/url-safety";

type QuestionImageProps = {
  publicFields: Record<string, unknown> | undefined;
  className?: string;
};

// Renders the topic's question image (publicFields[NEXT_PUBLIC_FIELD_IMAGE]) when configured.
// Parent should key it by itemId so a failed image doesn't hide the next question's image.
export function QuestionImage({ publicFields, className = "" }: QuestionImageProps) {
  const [failed, setFailed] = useState(false);
  const key = topicConfig.publicFields.image;
  const src = key ? publicFields?.[key] : null;

  if (typeof src !== "string" || !isSafeImageUrl(src) || failed) return null;

  return (
    <div className={["overflow-hidden rounded-2xl bg-base-900/40 ring-1 ring-inset ring-base-600/40", className].join(" ")}>
      <img
        src={src}
        alt=""
        decoding="async"
        onError={() => setFailed(true)}
        className="mx-auto block h-auto max-h-[200px] w-auto max-w-full object-contain"
      />
    </div>
  );
}
