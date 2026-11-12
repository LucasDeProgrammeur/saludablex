import { useState, type ReactNode } from "react";
import CameraCapture from "./CameraCapture";
import { prepareImage, type PreparedImage } from "../helpers/image";
import { errorMessage } from "../helpers/pocketbase";
import "./PhotoCapture.css";

interface PhotoCaptureProps {
  /** Called with the downscaled photo, ready for upload / analysis */
  onCapture: (image: PreparedImage) => void;
  /** Short instruction shown below the camera */
  tip?: ReactNode;
  /** Extra actions shown below the tip (e.g. "add manually") */
  children?: ReactNode;
}

/** Camera (or upload) + downscaling, with a tip and room for extra actions. */
export default function PhotoCapture({ onCapture, tip, children }: PhotoCaptureProps) {
  const [error, setError] = useState("");

  async function handlePhoto(photo: Blob) {
    setError("");
    try {
      onCapture(await prepareImage(photo));
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="photo-capture">
      <CameraCapture onPhoto={handlePhoto} />
      {tip && <p className="muted photo-capture-tip">{tip}</p>}
      {children}
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
