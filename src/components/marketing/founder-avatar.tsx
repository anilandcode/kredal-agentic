"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Founder photo with a graceful fallback. Renders the image with a unified
 * treatment (circular, grayscale → full colour on hover) so mismatched source
 * photos read as one brand; if the file is missing or fails to load, it falls
 * back to an initials monogram — so the team section is never broken.
 */
export function FounderAvatar({
  src,
  alt,
  initials,
}: {
  src: string;
  alt: string;
  initials: string;
}) {
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // If the image already errored before hydration attached onError (a 404 that
  // resolved during the initial HTML load), the event is missed — so re-check
  // on mount: a completed load with zero natural width means it's broken.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-card-02 text-h3 font-semibold text-brand ring-2 ring-border">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={80}
      height={80}
      onError={() => setFailed(true)}
      className="h-20 w-20 rounded-full object-cover object-top ring-2 ring-border grayscale transition duration-300 hover:grayscale-0"
    />
  );
}
