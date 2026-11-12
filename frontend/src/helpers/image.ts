export interface PreparedImage {
  /** Base64 data without the data: prefix — sent to the analyze endpoint */
  base64: string;
  mediaType: "image/jpeg";
  /** Same image as a Blob — stored on the food entry */
  blob: Blob;
  previewUrl: string;
}

/**
 * Downscales a photo (phones produce 4000px+ images) to keep uploads small
 * and recognition fast. 1280px on the long side is plenty for identifying food.
 */
export async function prepareImage(photo: Blob, maxSize = 1280, quality = 0.85): Promise<PreparedImage> {
  const bitmap = await createImageBitmap(photo, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process the image."))), "image/jpeg", quality),
  );
  const dataUrl = canvas.toDataURL("image/jpeg", quality);

  return {
    base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
    mediaType: "image/jpeg",
    blob,
    previewUrl: URL.createObjectURL(blob),
  };
}
