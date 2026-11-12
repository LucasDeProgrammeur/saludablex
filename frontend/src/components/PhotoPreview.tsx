import "./PhotoPreview.css";

interface PhotoPreviewProps {
  src: string;
  alt: string;
  /** Smaller, cropped version (e.g. in a sidebar) */
  small?: boolean;
  /** When set, shows the scanning animation with this label */
  scanningLabel?: string;
  className?: string;
}

/** Shows a taken photo, optionally with a "scanning" overlay while it is processed. */
export default function PhotoPreview({ src, alt, small, scanningLabel, className }: PhotoPreviewProps) {
  const classes = ["photo-preview", small && "is-small", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      <img src={src} alt={alt} />
      {scanningLabel && (
        <div className="photo-preview-scanning">
          <span className="photo-preview-scanline" aria-hidden="true" />
          <span className="photo-preview-scanning-label">{scanningLabel}</span>
        </div>
      )}
    </div>
  );
}
