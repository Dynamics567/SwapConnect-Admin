"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_FALLBACK = "/Card.png";

type Props = Omit<ImageProps, "src" | "onError"> & {
  src?: string | null;
  fallbackSrc?: string;
};

// Product/seller image URLs sometimes point nowhere real -- leftover seed
// data with a placeholder like example.com/default-product-image.jpg, a
// deleted Supabase object, a domain that isn't in next.config's allowlist.
// Whatever the cause, next/image otherwise renders the browser's bare
// broken-image icon with the alt text overlaid; this swaps to a real
// placeholder image instead once the request actually fails.
export default function ImageWithFallback({ src, fallbackSrc = DEFAULT_FALLBACK, ...props }: Props) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...props}
      src={imgSrc}
      onError={() => setImgSrc(fallbackSrc)}
    />
  );
}
