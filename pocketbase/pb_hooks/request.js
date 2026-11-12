// Request validation shared by the routes in food.pb.js.

const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Validates and returns { image, mediaType } from a request body. */
function readImage(body) {
  const image = body.image;
  const mediaType = body.mediaType || "image/jpeg";

  if (typeof image !== "string" || image.length === 0) {
    throw new BadRequestError("Missing image.");
  }
  if (MEDIA_TYPES.indexOf(mediaType) === -1) {
    throw new BadRequestError("Unsupported image type.");
  }
  // ~7.5 MB of image data; the frontend downsizes photos well below this.
  if (image.length > 10 * 1024 * 1024) {
    throw new BadRequestError("Image is too large.");
  }
  return { image, mediaType };
}

module.exports = { readImage };
