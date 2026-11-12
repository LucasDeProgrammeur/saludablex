import { useEffect, useRef, useState } from "react";
import "./CameraCapture.css";

interface CameraCaptureProps {
  /** Called with the captured frame or the uploaded file */
  onPhoto: (photo: Blob) => void;
}

type Status = "starting" | "live" | "denied" | "unavailable";
type Facing = "environment" | "user";

/**
 * Live camera viewfinder (rear camera on phones, webcam on PCs) with a shutter
 * button. Upload is always available as an alternative / fallback.
 */
export default function CameraCapture({ onPhoto }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const nativeCameraRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("starting");
  const [facing, setFacing] = useState<Facing>("environment");
  const [cameraCount, setCameraCount] = useState(0);
  const [flash, setFlash] = useState(false);

  // getUserMedia only exists in secure contexts (https or localhost)
  const supported = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!supported) {
      setStatus("unavailable");
      return;
    }

    let stream: MediaStream | null = null;
    let cancelled = false;
    setStatus("starting");

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1440 } },
      })
      .then(async (s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => undefined);
        }
        setStatus("live");
        // Device labels/count are only reliable after permission is granted
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setCameraCount(devices.filter((d) => d.kind === "videoinput").length);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setStatus(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "unavailable");
      });

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [facing, supported]);

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setFlash(true);
    window.setTimeout(() => setFlash(false), 250);
    canvas.toBlob((blob) => blob && onPhoto(blob), "image/jpeg", 0.92);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onPhoto(file);
  }

  return (
    <div className="camera-capture">
      <div className={`camera-capture-viewfinder${facing === "user" ? " is-mirrored" : ""}`}>
        <video ref={videoRef} playsInline muted autoPlay aria-label="Camera preview" />

        {status === "starting" && <div className="camera-capture-message">Starting camera…</div>}
        {status === "denied" && (
          <div className="camera-capture-message">
            <p>Camera access was blocked.</p>
            <p className="muted">Allow the camera in your browser's site settings, or upload a photo instead.</p>
          </div>
        )}
        {status === "unavailable" && (
          <div className="camera-capture-message">
            <p>No camera available here.</p>
            <p className="muted">
              {supported
                ? "No camera was found on this device."
                : "The live camera needs a secure (https) connection."}{" "}
              You can still upload a photo.
            </p>
            {!supported && (
              <button type="button" className="secondary" onClick={() => nativeCameraRef.current?.click()}>
                Open phone camera
              </button>
            )}
          </div>
        )}

        {status === "live" && <div className="camera-capture-frame" aria-hidden="true" />}
        {flash && <div className="camera-capture-flash" aria-hidden="true" />}
      </div>

      <div className="camera-capture-controls">
        <button type="button" className="secondary camera-capture-side" onClick={() => uploadRef.current?.click()}>
          Upload
        </button>

        <button
          type="button"
          className="camera-capture-shutter"
          aria-label="Take photo"
          disabled={status !== "live"}
          onClick={capture}
        />

        {cameraCount > 1 ? (
          <button
            type="button"
            className="secondary camera-capture-side"
            onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
          >
            Flip
          </button>
        ) : (
          <span className="camera-capture-side" />
        )}
      </div>

      <input ref={uploadRef} className="visually-hidden" type="file" accept="image/*" onChange={handleFile} />
      <input
        ref={nativeCameraRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
      />
    </div>
  );
}
