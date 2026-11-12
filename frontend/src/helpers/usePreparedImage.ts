import { useEffect, useState } from "react";
import type { PreparedImage } from "./image";

/**
 * Holds a prepared photo and frees its preview blob URL when the photo is
 * replaced or the component unmounts.
 */
export function usePreparedImage() {
  const [image, setImage] = useState<PreparedImage | null>(null);

  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.previewUrl);
    },
    [image],
  );

  return [image, setImage] as const;
}
